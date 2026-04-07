package org.example.filesharing.jobs.kafka;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class VideoEncodeProducer {

    @Autowired
    KafkaTemplate<String, String> videoEncodeKafkaTemplate;

    @Value(value = "${kafka.topics.video_encode_topic}")
    private String topic;

    public void sendPreSignedUrlViaKafka(String url) {
        videoEncodeKafkaTemplate.send(topic, url);
    }
}
