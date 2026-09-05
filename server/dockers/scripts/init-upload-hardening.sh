#!/bin/sh
set -e

MINIO_HOST="${MINIO_HOST:-http://minio:9000}"
ALIAS_NAME="${ALIAS_NAME:-myminio}"
BUCKET_FILES="${BUCKET_FILES:-file-sharing}"

SVC_UPLOAD_ACCESS_KEY="${MINIO_SVC_UPLOAD_ACCESS_KEY:-svcuploadfsharing}"
SVC_UPLOAD_SECRET_KEY="${MINIO_SVC_UPLOAD_SECRET_KEY:-ChangeMe_UploadSecret_2026}"
SVC_DOWNLOAD_ACCESS_KEY="${MINIO_SVC_DOWNLOAD_ACCESS_KEY:-svcdownloadfsharing}"
SVC_DOWNLOAD_SECRET_KEY="${MINIO_SVC_DOWNLOAD_SECRET_KEY:-ChangeMe_DownloadSecret_2026}"

echo "============================================"
echo "  MinIO Upload Hardening (WP1)"
echo "  host=${MINIO_HOST} bucket=${BUCKET_FILES}"
echo "============================================"

# ---------- 1. Alias ----------
echo "[1/5] mc alias set"
mc alias set "${ALIAS_NAME}" "${MINIO_HOST}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"

# ---------- 2. Policy JSON ----------
echo "[2/5] Sinh policy JSON"

cat > /tmp/svc-upload-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MultipartWrite",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": ["arn:aws:s3:::${BUCKET_FILES}/*"]
    },
    {
      "Sid": "StatAndReconcile",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::${BUCKET_FILES}/*"]
    },
    {
      "Sid": "ListIncompleteUploads",
      "Effect": "Allow",
      "Action": ["s3:ListBucketMultipartUploads"],
      "Resource": ["arn:aws:s3:::${BUCKET_FILES}"]
    }
  ]
}
EOF

cat > /tmp/svc-download-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOnly",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::${BUCKET_FILES}/*"]
    }
  ]
}
EOF

# ---------- 3. Service accounts ----------
echo "[3/5] Tạo service account svc-upload"
if mc admin user svcacct info "${ALIAS_NAME}" "${SVC_UPLOAD_ACCESS_KEY}" >/dev/null 2>&1; then
    echo "      svc-upload đã tồn tại — cập nhật policy"
    mc admin user svcacct edit "${ALIAS_NAME}" "${SVC_UPLOAD_ACCESS_KEY}" \
        --policy /tmp/svc-upload-policy.json
else
    mc admin user svcacct add "${ALIAS_NAME}" "${MINIO_ROOT_USER}" \
        --access-key "${SVC_UPLOAD_ACCESS_KEY}" \
        --secret-key "${SVC_UPLOAD_SECRET_KEY}" \
        --policy /tmp/svc-upload-policy.json
fi

echo "      Tạo service account svc-download"
if mc admin user svcacct info "${ALIAS_NAME}" "${SVC_DOWNLOAD_ACCESS_KEY}" >/dev/null 2>&1; then
    echo "      svc-download đã tồn tại — cập nhật policy"
    mc admin user svcacct edit "${ALIAS_NAME}" "${SVC_DOWNLOAD_ACCESS_KEY}" \
        --policy /tmp/svc-download-policy.json
else
    mc admin user svcacct add "${ALIAS_NAME}" "${MINIO_ROOT_USER}" \
        --access-key "${SVC_DOWNLOAD_ACCESS_KEY}" \
        --secret-key "${SVC_DOWNLOAD_SECRET_KEY}" \
        --policy /tmp/svc-download-policy.json
fi

# ---------- 4. Abort incomplete multipart sau 7 ngày ----------
# LƯU Ý (sai lệch tài liệu đã ghi nhận — xem báo cáo T-1.3):
# `mc ilm import` với rule CHỈ chứa AbortIncompleteMultipartUpload (không kèm Expiration)
# bị MinIO server từ chối "XML you provided was not well-formed" trên mọi bản đã thử
# (RELEASE.2025-06-13, RELEASE.2025-07-23, RELEASE.2025-09-07) — bug đã biết, MinIO đóng
# issue với nhãn "working as intended" (minio/minio#19115). Ghép chung với Expiration thì
# field bị server âm thầm bỏ qua khi export lại — không dùng được.
# => Dùng cơ chế nội bộ MinIO "stale uploads cleanup" (độc lập S3 Lifecycle API) làm tầng 1
#    thay thế, cùng ý nghĩa REL-03 (abort multipart dở sau 7 ngày, không phụ thuộc ứng dụng).
echo "[4/5] Stale uploads cleanup: abort incomplete multipart sau 7 ngày"
mc admin config set "${ALIAS_NAME}" api stale_uploads_expiry=168h stale_uploads_cleanup_interval=6h

# ---------- 5. Verify ----------
echo "[5/5] Verify"
echo "--- stale uploads config ---"
mc admin config get "${ALIAS_NAME}" api
echo "--- svcacct ls ---"
mc admin user svcacct ls "${ALIAS_NAME}" "${MINIO_ROOT_USER}"

rm -f /tmp/svc-upload-policy.json /tmp/svc-download-policy.json

echo "============================================"
echo "  Hoàn tất. Ghi 4 giá trị sau vào .env / application.yml:"
echo "    MINIO_SVC_UPLOAD_ACCESS_KEY=${SVC_UPLOAD_ACCESS_KEY}"
echo "    MINIO_SVC_UPLOAD_SECRET_KEY=<đã set>"
echo "    MINIO_SVC_DOWNLOAD_ACCESS_KEY=${SVC_DOWNLOAD_ACCESS_KEY}"
echo "    MINIO_SVC_DOWNLOAD_SECRET_KEY=<đã set>"
echo "============================================"

exit 0
