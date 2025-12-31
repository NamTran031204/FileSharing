#!/bin/bash

# ============================================================
# SCRIPT KHỞI TẠO MINIO (RUN INSIDE CONTAINER)
# ============================================================

set -e

# Cấu hình kết nối (Localhost vì chạy trong cùng container)
MINIO_HOST="http://localhost:9000"
ALIAS_NAME="myminio"
MC_PATH="/usr/local/bin/mc"
ACCESS_FILE="/config/access.txt"

# Lấy biến môi trường từ Docker Compose
USER="${MINIO_ROOT_USER}"
PASS="${MINIO_ROOT_PASSWORD}"

echo ">> [INIT] Bắt đầu quá trình khởi tạo..."

# ------------------------------------------------------------
# BƯỚC 1: Cài đặt MinIO Client (mc) nếu chưa có
# ------------------------------------------------------------
if [ ! -f "$MC_PATH" ]; then
    echo ">> [INIT] Không tìm thấy 'mc'. Đang tải xuống..."
    # [cite_start]Dockerfile đã có curl [cite: 1]
    curl -f https://dl.min.io/client/mc/release/linux-amd64/mc -o $MC_PATH
    chmod +x $MC_PATH
    echo ">> [INIT] Cài đặt 'mc' thành công."
else
    echo ">> [INIT] 'mc' đã được cài đặt."
fi

# ------------------------------------------------------------
# BƯỚC 2: Đợi MinIO Server khởi động và Kết nối
# ------------------------------------------------------------
echo ">> [INIT] Đang chờ MinIO Server tại ${MINIO_HOST}..."

MAX_RETRIES=30
COUNT=0

while [ $COUNT -lt $MAX_RETRIES ]; do
    # Thử kết nối, tắt output lỗi để đỡ rác log
    if $MC_PATH alias set $ALIAS_NAME $MINIO_HOST $USER $PASS > /dev/null 2>&1; then
        echo ">> [INIT] Kết nối MinIO thành công!"
        break
    fi
    sleep 2
    COUNT=$((COUNT+1))
    echo "   ... chờ MinIO sẵn sàng ($COUNT/$MAX_RETRIES)"
done

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo ">> [INIT] Lỗi: MinIO không phản hồi."
    exit 1
fi

# ------------------------------------------------------------
# BƯỚC 3: Tạo Bucket 'file-sharing'
# ------------------------------------------------------------
BUCKET_NAME="file-sharing"
if $MC_PATH ls $ALIAS_NAME/$BUCKET_NAME > /dev/null 2>&1; then
    echo ">> [INIT] Bucket '$BUCKET_NAME' đã tồn tại."
else
    echo ">> [INIT] Đang tạo bucket '$BUCKET_NAME'..."
    $MC_PATH mb $ALIAS_NAME/$BUCKET_NAME
    echo ">> [INIT] Tạo bucket thành công."
fi

# ------------------------------------------------------------
# BƯỚC 4: Tạo Service Account và Ghi file
# ------------------------------------------------------------
echo ">> [INIT] Đang tạo Access Key mới..."

# Tạo thư mục config nếu chưa có
mkdir -p /config

# Tạo key và lưu JSON output
# 2>/dev/null để ẩn các log thừa của mc
JSON_OUTPUT=$($MC_PATH admin user svcacct add $ALIAS_NAME $USER --json 2>/dev/null)

if [ -z "$JSON_OUTPUT" ]; then
    echo ">> [INIT] Lỗi: Không thể tạo Access Key (hoặc lỗi parse)."
else
    # Ghi toàn bộ JSON vào file để sử dụng sau
    echo "$JSON_OUTPUT" > $ACCESS_FILE

    # In ra log để bạn dễ debug (chỉ in Access Key)
    ACCESS_KEY=$(echo $JSON_OUTPUT | grep -o '"accessKey":"[^"]*"' | cut -d'"' -f4)
    echo ">> [INIT] Đã ghi thông tin vào $ACCESS_FILE"
    echo "   + Access Key: $ACCESS_KEY"
fi

echo ">> [INIT] Hoàn tất cấu hình!"