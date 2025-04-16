---
title: maven
date: 2024-06-27 22:13:31
tags:
description:
---
# POM
# 配置

## Scope
？？？

# 命令
mvn clean package -DskipTests
mvn clean install
mvn clean install -pl <module-name> -am
```
clean: 清理目标目录（通常是 target 目录）
install: 将构建的 artifact 安装到本地仓库
-pl 或 --projects: 指定要构建的模块列表（Project List）
-am 或 --also-make: 同时构建指定模块依赖的其他模块（Also Make）
```
