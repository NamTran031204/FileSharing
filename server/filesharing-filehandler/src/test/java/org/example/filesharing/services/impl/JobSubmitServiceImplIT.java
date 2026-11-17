package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.enums.MediaType;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import static org.junit.jupiter.api.Assertions.*;

/** Chi chay tren database filesharing_it. Thieu IT_MONGO_URI thi fail, khong skip. */
class JobSubmitServiceImplIT {
    private static MongoClient client;
    private static MongoTemplate mongo;
    private JobSubmitServiceImpl service;

    @BeforeAll
    static void connect() {
        String uri = System.getenv("IT_MONGO_URI");
        assertNotNull(uri, "thieu bien moi truong IT_MONGO_URI");
        ConnectionString cs = new ConnectionString(uri);
        assertEquals("filesharing_it", cs.getDatabase(), "IT chi duoc chay tren database filesharing_it");
        client = MongoClients.create(cs);
        mongo = new MongoTemplate(client, cs.getDatabase());
    }

    @AfterAll
    static void close() {
        client.close();
    }

    @BeforeEach
    void setUp() {
        mongo.dropCollection("processing_jobs");
        mongo.dropCollection("metadata");
        service = new JobSubmitServiceImpl(mongo,
                new com.file.service.filesharing.core.setting.RuntimeSettings(mongo, null,
                        new org.springframework.mock.env.MockEnvironment(), java.time.Duration.ofSeconds(10)));
    }

    private MetadataEntity meta(String objectName, MediaType type) {
        MetadataEntity m = MetadataEntity.builder().fileId(new ObjectId().toHexString())
                .objectName(objectName).assetId("a1").versionNumber(1).mediaType(type).build();
        return mongo.insert(m);
    }

    private long jobs(MetadataEntity m) {
        return mongo.count(Query.query(Criteria.where("metadataId").is(m.getFileId())), ProcessingJobEntity.class);
    }

    @Test
    void submitTwiceSameMetadataCreatesOneJob() {
        MetadataEntity m = meta("x.png", MediaType.IMAGE);
        String id1 = service.submit(m);
        String id2 = service.submit(m);
        assertEquals(id1, id2);
        assertEquals(1, jobs(m));
        ProcessingJobEntity j = mongo.findById(id1, ProcessingJobEntity.class);
        assertEquals(ProcessingJobStatus.PENDING, j.getStatus());
        assertEquals(ProcessingJobType.TRANSCODE_IMAGE, j.getJobType());
        assertNotNull(j.getDueAt());
        assertNotNull(j.getCreatedAt());
        assertEquals(id1, mongo.findById(m.getFileId(), MetadataEntity.class).getCurrentJobId());
    }

    @Test
    void resubmitDoesNotResetProcessingJob() {
        MetadataEntity m = meta("y.png", MediaType.IMAGE);
        String id = service.submit(m);
        mongo.updateFirst(Query.query(Criteria.where("_id").is(id)),
                new Update().set("status", ProcessingJobStatus.PROCESSING).set("attemptId", "att-1"), ProcessingJobEntity.class);
        service.submit(m);
        ProcessingJobEntity j = mongo.findById(id, ProcessingJobEntity.class);
        assertEquals(ProcessingJobStatus.PROCESSING, j.getStatus());
        assertEquals("att-1", j.getAttemptId());
        assertEquals(1, jobs(m));
    }

    @Test
    void routesJobTypeByMediaAndExtension() {
        assertEquals(ProcessingJobType.TRANSCODE_HLS, typeOf(meta("v.mp4", MediaType.VIDEO)));
        assertEquals(ProcessingJobType.TRANSCODE_RAW_IMAGE, typeOf(meta("IMG_1.CR2", MediaType.IMAGE)));
        assertEquals(ProcessingJobType.TRANSCODE_RAW_IMAGE, typeOf(meta("d.nef", MediaType.IMAGE)));
        assertEquals(ProcessingJobType.TRANSCODE_IMAGE, typeOf(meta("p.jpg", MediaType.IMAGE)));
    }

    private ProcessingJobType typeOf(MetadataEntity m) {
        return mongo.findById(service.submit(m), ProcessingJobEntity.class).getJobType();
    }
}
