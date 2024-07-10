---
title: jdbc
date: 2024-06-22 15:59:32
tags: 
    - JAVA
    - JDBC
description: 
---
- 加载驱动
- 相关类
- 预编译参数化
- 批处理
- 事务
- 连接池
<!--more-->
# 加载驱动
## 手动加载驱动
### 1
```
//Driver driver = new Driver();
//DriverManager.registerDriver(driver);
```
### 2
```
Class.forName("com.mysql.cj.jdbc.Driver");
```
## 自动加载（SPI机制加载）
mysql-connector-java.jar中 meta-info/services/java.sql.Driver文件说明了驱动类型
不是所有mysql版本都支持

# 相关类
- Driver
- DriverManager
- Connection
- Statement

```
1. 加载驱动 DriverManager.registerDriver(new Driver());
2. 获取连接connection = DriverManager.getConnection(url, "root", "root");
3. 获取statement = connection.createStatement();
4. 执行statement.execute...
```
# 预编译参数化
## 防止sql注入
预编译后，会将参数中单引号转义，达到防止注入的目的

在获取statement时提供sql语句模版 进行预编译，执行前提供参数，再根据具体参数执行。
```
preparedStatement = connection.prepareStatement("select * from v_user where name = ? ");
preparedStatement.setString(1, "vvf");

```
## 效率
缓存预编译结果
如若sql只执行一次不会提升性能，还会占用缓存
## 开启设置
jdbc:mysql://localhost:3306/db？......&useServerPrepStmts=true&cachePrepStmts=true

# 批处理
## 开启设置
&rewriteBatchedStatements=true

## 示例
```
preparedStatement = connection.prepareStatement("insert into v_user values(?,?,?,?,?)");

            for (int i = 0; i < 1000; i++) {
                int id = i + 2;
                preparedStatement.setInt(1, id);
                preparedStatement.setString(2, "v" + id);
                preparedStatement.setInt(3, id % 2);
                preparedStatement.setInt(4, id % 100);
                preparedStatement.setDate(5,new Date(System.currentTimeMillis()));
                preparedStatement.addBatch(); // addBatch

                //if (i % 100 == 0) {
                //    preparedStatement.executeBatch();
                //    preparedStatement.clearBatch();// 清除缓存
                //}
            }

            preparedStatement.executeBatch(); // exec
```



### 问题
一批sql语句过多造成内存再用过大，可将其分为多批处理

```
for (int i = 0; i < 1000; i++) {
                int id = i + 2;
                preparedStatement.setInt(1, id);
                preparedStatement.setString(2, "v" + id);
                preparedStatement.setInt(3, id % 2);
                preparedStatement.setInt(4, id % 100);
                preparedStatement.setDate(5,new Date(System.currentTimeMillis()));                

                if (i % 100 == 0) {
                    preparedStatement.executeBatch();
                    preparedStatement.clearBatch();// 清除缓存
                }
            }

            preparedStatement.executeBatch();
            preparedStatement.clearBatch();
```

# 事务
默认自动提交事务
设置手动提交：` connection.setAutoCommit(false);`

catch块执行回滚: `connection.rollback();`
finally执行提交：`connection.commit();`

## 回滚点
设置：`connection.setSavepoint()`
回滚：`connection.rollback(savepoint);`

# 连接池

## 开源的连接池
- c3p0
- dbcp
- druid

