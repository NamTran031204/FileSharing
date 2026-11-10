package com.file.service.filesharing.core.job.tool;

// Doc tung dong output cua cong cu (da che bi mat). Moi lan chay mot instance. Nem exception thi dong do bi bo qua.
@FunctionalInterface
public interface LineParser {
    void onLine(boolean stderr, String line);
}
