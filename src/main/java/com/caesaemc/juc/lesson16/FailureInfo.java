package com.caesaemc.juc.lesson16;

/**
 * 对外保留稳定错误信息，避免把可变 Throwable 直接暴露到响应协议。
 */
public record FailureInfo(String type, String message) {

    public static FailureInfo from(Throwable failure) {
        String message = failure.getMessage();
        return new FailureInfo(
                failure.getClass().getSimpleName(),
                message == null ? "" : message
        );
    }
}
