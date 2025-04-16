---
title: 42grant之后要跟着FlushPrivileges吗
tags: mysql
description: 42grant之后要跟着FlushPrivileges吗
date: 2025-03-22 10:31:44
---

# 全局权限
grant all privileges on *.* to 'ua'@'%' with grant option;
grant会修改mysql.user表和内存数组acl_users中用户对象权限，但已存在的链接不受影响(不影响链接线程对象)

收回所有权限
revoke all privileges on *.* from 'ua'@'%';

查询用户权限
select * from mysql.user where user='ua'\G

# db权限
分配db1库所有权限
基于库的权限记录保存在mysql.db表中，在内存里则保存在数组acl_dbs中
grant all privileges on db1.* to 'ua'@'%' with grant option;

查询db权限
select * from mysql.db where user='ua'\G
# 表权限和列权限
表权限定义mysql.tables_priv
列权限定义mysql.columns_priv
这两类权限，组合起来存放在内存hash结构column_priv_hash

grant all privileges on db1.t1 to 'ua'@'%' with grant option;
GRANT SELECT(id), INSERT (id,a) ON mydb.mytbl TO 'ua'@'%' with grant option;

# flush privileges
flush privileges命令会清空acl_users数组，然后从 mysql.user 表中读取数据重新加载，重新构造一个acl_users数组。也就是说，以数据表中的数据为准，会将全局权限内存数组重新加载一遍。
