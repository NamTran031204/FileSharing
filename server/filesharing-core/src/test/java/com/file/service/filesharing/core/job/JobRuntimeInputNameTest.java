package com.file.service.filesharing.core.job;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JobRuntimeInputNameTest {

    @ParameterizedTest
    @CsvSource(value = {
            "job-test/a.png|source.png",
            "UUID_Ảnh thử.JPG|source.jpg",
            "x/y/z.CR2|source.cr2",
            "dir\\file.PNG|source.png",
            "a.tar.gz|source.gz",
            "noext|source",
            "a.|source",
            "a.[x]|source",
            "a.verylongext9|source",
            "a.p n g|source",
            "-if 1 -o x.png|source.png",
    }, delimiter = '|')
    void table(String objectName, String expected) {
        assertEquals(expected, JobRuntime.localInputName(objectName));
    }

    @Test
    void controlCharsAndNullNeverLeak() {
        assertEquals("source.cr2", JobRuntime.localInputName("a\n-if\n1\n.cr2"));
        assertEquals("source", JobRuntime.localInputName("a.cr\n2"));
        assertEquals("source", JobRuntime.localInputName(null));
        for (String s : new String[]{"a\r\n.png", "x/../../etc/passwd", "a.PnG\u0000"}) {
            assertTrue(JobRuntime.localInputName(s).matches("source(\\.[a-z0-9]{1,8})?"), s);
        }
    }
}
