#!/bin/sh

# 必须通过 source 执行，才能把 JAVA_HOME 和 PATH 留在当前终端。
juc_java_home_candidate=""

juc_is_java21() {
  [ -x "$1/bin/java" ] || return 1
  "$1/bin/java" -version 2>&1 | sed -n '1p' | grep -Eq 'version "21([."]|$)'
}

if juc_is_java21 /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home; then
  juc_java_home_candidate=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
fi

if [ -z "$juc_java_home_candidate" ] && juc_is_java21 /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home; then
  juc_java_home_candidate=/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
fi

if [ -z "$juc_java_home_candidate" ] && [ -x /usr/libexec/java_home ]; then
  juc_java_home_from_macos=$(/usr/libexec/java_home -v 21 2>/dev/null || true)
  if [ -n "$juc_java_home_from_macos" ] && juc_is_java21 "$juc_java_home_from_macos"; then
    juc_java_home_candidate=$juc_java_home_from_macos
  fi
fi

for juc_java_home_from_linux in /usr/lib/jvm/java-21-openjdk /usr/lib/jvm/java-21-openjdk-amd64; do
  if [ -z "$juc_java_home_candidate" ] && juc_is_java21 "$juc_java_home_from_linux"; then
    juc_java_home_candidate=$juc_java_home_from_linux
  fi
done

if [ -z "$juc_java_home_candidate" ]; then
  echo "未找到 JDK 21。请先安装 JDK 21，再设置 JAVA_HOME。" >&2
  return 1 2>/dev/null || exit 1
fi

export JAVA_HOME="$juc_java_home_candidate"
export PATH="$JAVA_HOME/bin:$PATH"

echo "已切换到 JAVA_HOME=$JAVA_HOME"
java -version
