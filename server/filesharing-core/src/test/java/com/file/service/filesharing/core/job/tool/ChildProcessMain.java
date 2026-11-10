package com.file.service.filesharing.core.job.tool;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Tien trinh con gia lap cong cu ngoai, dung cho test ToolRunner. */
public class ChildProcessMain {

    // Lenh chay class nay bang chinh JVM dang chay test
    public static List<String> cmd(String... args) {
        List<String> c = new ArrayList<>();
        c.add(ProcessHandle.current().info().command().orElseThrow());
        c.add("-cp");
        c.add(System.getProperty("java.class.path"));
        c.add(ChildProcessMain.class.getName());
        c.addAll(Arrays.asList(args));
        return c;
    }

    public static void main(String[] a) throws Exception {
        switch (a[0]) {
            case "exit" -> System.exit(Integer.parseInt(a[1]));
            case "stderr" -> {
                for (int i = 2; i < a.length; i++) System.err.println(a[i]);
                System.err.flush();
                System.exit(Integer.parseInt(a[1]));
            }
            case "lines" -> {
                // lines <exit> <n>: in n dong stderr dai ~50 ky tu, danh so 001..n
                int n = Integer.parseInt(a[2]);
                for (int i = 1; i <= n; i++) System.err.printf("LINE-%03d xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx%n", i);
                System.err.flush();
                System.exit(Integer.parseInt(a[1]));
            }
            case "flood" -> {
                int kb = Integer.parseInt(a[1]);
                String line = "y".repeat(99);
                for (int i = 0; i < kb * 1024 / 100; i++) System.err.println(line);
                System.err.flush();
                System.exit(0);
            }
            case "sleep" -> {
                System.out.println("child=" + ProcessHandle.current().pid());
                System.out.flush();
                Thread.sleep(Long.parseLong(a[1]));
            }
            case "spawn-grandchild" -> {
                Process g = new ProcessBuilder(cmd("sleep", a[1])).start();
                System.out.println("child=" + ProcessHandle.current().pid() + " grandchild=" + g.pid());
                System.out.flush();
                Thread.sleep(Long.parseLong(a[1]));
            }
            case "print-env" -> {
                System.getenv().keySet().forEach(System.out::println);
                System.out.flush();
            }
            default -> throw new IllegalArgumentException(a[0]);
        }
    }
}
