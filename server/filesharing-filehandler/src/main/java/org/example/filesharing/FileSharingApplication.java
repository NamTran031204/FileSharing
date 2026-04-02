package org.example.filesharing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class FileSharingApplication {

    public static void main(String[] args) {
        SpringApplication.run(FileSharingApplication.class, args);
    }

}
