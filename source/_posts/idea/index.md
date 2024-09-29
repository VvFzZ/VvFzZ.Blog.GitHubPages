---
title: idea
date: 2024-07-19 16:07:48
tags:
description: idea
---
# 引入本地jar包
## pom
1. 根目录下新建libs文件夹
2. 配置pom 
        ```
        <dependency>
            <groupId>com.vvf</groupId>
            <artifactId>com.vvf.learn.hello1</artifactId>
            <version>0.0.1-SNAPSHOT</version>
            <scope>system</scope>
            <systemPath>${project.basedir}/lib/com.vvf.learn.hello1-1.0-SNAPSHOT.jar</systemPath>
        </dependency>
        <plugin>
            <configuration>
                    <mainClass>com.vvf.msbspringbootmybatis.Application</mainClass>
                    <skip>true</skip>
                    <includeSystemScope>true</includeSystemScope>
            </configuration>
        </plugin>
    ``` 
## ProjectSettings
File -> ProjectStrure -> ProjectSetings -> libraries -> "添加"按钮