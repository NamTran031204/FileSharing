package com.file.service.filesharingimagerawproccess.exif;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Gia lap giao thuc exiftool -stay_open True -@ -: doc tung arg tren stdin toi -execute<n>, in ket qua roi {ready<n>}.
 * Arg dac biet: "hang" -> treo; "slow" <ms> -> cho; "id=<x>" -> in "result id=<x>" ra stdout.
 * "-echo4" <text> -> in text ra stderr sau lenh. "-stay_open" "False" -> thoat.
 */
public class FakeExifToolMain {
    public static List<String> cmd() {
        List<String> c = new ArrayList<>();
        c.add(ProcessHandle.current().info().command().orElseThrow());
        c.add("-cp");
        c.add(System.getProperty("java.class.path"));
        c.add(FakeExifToolMain.class.getName());
        return c;
    }

    public static void main(String[] a) throws Exception {
        BufferedReader in = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
        List<String> args = new ArrayList<>();
        String line;
        while ((line = in.readLine()) != null) {
            if (line.startsWith("-execute")) {
                run(args, line.substring("-execute".length()));
                args.clear();
            } else {
                args.add(line);
                if (args.size() >= 2 && args.get(args.size() - 2).equals("-stay_open") && line.equals("False")) return;
            }
        }
    }

    private static void run(List<String> args, String n) throws Exception {
        String echo4 = null;
        for (int i = 0; i < args.size(); i++) {
            String s = args.get(i);
            if (s.equals("hang")) Thread.sleep(Long.MAX_VALUE);
            if (s.equals("slow")) Thread.sleep(Long.parseLong(args.get(i + 1)));
            if (s.startsWith("id=")) System.out.println("result " + s);
            if (s.equals("-echo4")) echo4 = args.get(i + 1);
        }
        System.out.println("{ready" + n + "}");
        System.out.flush();
        if (echo4 != null) {
            System.err.println(echo4);
            System.err.flush();
        }
    }
}
