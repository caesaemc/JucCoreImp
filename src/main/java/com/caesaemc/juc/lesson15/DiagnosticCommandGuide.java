package com.caesaemc.juc.lesson15;

import java.util.List;

/**
 * 根据目标 JVM 的 pid 生成本课常用诊断命令。
 */
public final class DiagnosticCommandGuide {

    private DiagnosticCommandGuide() {
    }

    public static List<String> forPid(long pid) {
        if (pid <= 0) {
            throw new IllegalArgumentException("pid 必须大于 0");
        }
        return List.of(
                "jcmd " + pid + " Thread.print -l",
                "jcmd " + pid + " VM.native_memory summary",
                "jcmd " + pid + " JFR.start name=juc settings=profile duration=30s filename=target/juc.jfr",
                "jcmd " + pid + " JFR.check",
                "jstack -l " + pid
        );
    }
}
