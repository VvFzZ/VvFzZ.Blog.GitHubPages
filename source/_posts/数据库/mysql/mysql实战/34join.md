---
title: 34join
description: 34join
date: 2025-03-21 22:57:50
tags: mysql
---
两个问题
1. DBA不让使用 join，有什么问题呢？
2. 两个大小不同的表join，用哪个表做驱动表呢？

创建两个表 t1 和 
```
CREATE TABLE `t2` (
 `id` int(11) NOT NULL,
 `a` int(11) DEFAULT NULL,
 `b` int(11) DEFAULT NULL,
 PRIMARY KEY (`id`),
  KEY `a` (`a`)
 ) ENGINE=InnoDB;

 drop procedure idata;
 delimiter ;;
 create procedure idata()
 begin
 declare i int;
 set i=1;
 while(i<=1000)do
 insert into t2 values(i, i, i);
 set i=i+1;
 end while;
 end;;
 delimiter ;
 call idata();

 create table t1 like t2;
 insert into t1 (select * from t2 where id<=100)
 ```

# Index Nested-Loop Join
select * from t1 straight_join t2 on (t1.a=t2.a);
straight_join 让 MySQL 使用固定的连接方式执行查询,优化器只会按照我们指定的方式去 join。在这个语句里，t1 是驱动表，t2 是被驱动表。

join使用索引，从t1读出一行R，取R.a到t2表查询，取出t2中满足的行，与R组成结果集的一行返回，重复读取t1所有行结束

遍历t1取出R.a再查表t2，形式上和嵌套类似且使用被驱动表索引，所以称为Index Nested-Loop Join，NLJ

## 不使用join
1. 执行select * from t1，查出表 t1 的所有数据，这里有 100 行；
2. 循环遍历这100行数据：
每一行R取出字段a的值$R.a；
执行select * from t2 where t2.a=$R.a；
把返回的结果和R构成结果集的一行。

扫描了200行，但是执行了101条语句，比直接join多了100次交互。此外，客户端还要自己拼接SQL语句和结果。

## 怎么选择驱动表(小表作为驱动表)
扫描行数决定
驱动表行数N，被驱动表行数M
扫描行数= N + N(log2M + 1) 
说明：驱动表全表扫描 + N次（驱动表索引树查找+主键查找）
N小时扫描行数少

# Simple Nested-Loop Join
被索引表不使用索引
扫描行数N*M， 
100*1000=10 万，若数据达到10w，就要扫描100亿行，太低效了。

MySQL也没有使用这个Simple Nested-Loop Join算法，而是使用了另一个叫作“Block Nested-Loop Join”的算法，简称 BNL。

逐行取驱动表数据，遍历被驱动表。被驱动表需要不停从磁盘刷入buffer pool且影响内存命中率

# Block Nested-Loop Join
1. 把t1读入线程内存join_buffer，由于这个语句中是select *，因此把整个表t1放入了内存；
2. 扫描t2，把t2中的每一行取出来，跟join_buffer中的数据做对比，满足join条件的，作为结果集的一部分返回。

扫描行数：N+M
内存判断：N*M
相比Simple Nested-Loop Join内存判断快得多，性能更好，但会占用大量的系统资源。尽量不要用
若explain Extra字段里面有 Block Nested Loop 说明是BNJ

同样是小表驱动，且join_buffer越大越高效（扫描M的次数变少）

**小表**
在决定哪个表做驱动表的时候，应该是两个表按照各自的条件过滤，过滤完成之后，计算参与 join 的各个字段的总数据量，数据量小的那个表，就是“小表”，应该作为驱动表。

# join优化
## MRR Muti-Range Read
目的：尽量使用顺序读盘
比如join使用rowid排序，现将b.id在内存中递增排序，再回表查询b的数据

## BKA Batch Key Access
MySQL5.6引入，优化NLJ算法遍历驱动表时，一行一行取数据，
优化后NLJ算法将一次取出多行，利用内存（join_buffer）存储一段数据，内存不足时分段

启用BKA和MRR（BKA依赖MRR）
```
set optimizer_switch='mrr=on,mrr_cost_based=off,batched_key_access=on';
```
## BNL问题
BNL算法堆系统的影响（io,cpu,内存命中）
1. 可能多次扫描被驱动表，占用磁盘IO资源；
2. 判断join条件需要执行M*N次对比（M、N 分别是两张表的行数），如果是大表就会占用非常多的CPU资源；
3. 可能会导致Buffer Pool的热数据被淘汰，影响内存命中率。


InnoDB的LRU算法，InnoDB对Bufffer Pool的LRU算法做了优化，即：第一次从磁盘读入内存的数据页，会先放在old区域。
如果1秒之后这个数据页不再被访问了，就不会被移动到LRU链表头部，这样对Buffer Pool的命中率影响就不大。

# 总结
1. BKA优化MySQL已内置支持，建议默认使用；
2. BNL算法效率低，建议尽量转成BKA算法。优化的方向：给被驱动表的关联字段加索引
3. 基于临时表的改进方案，对于能够提前过滤出小数据的join语句来说，效果还是很好的；
4. MySQL目前版本不支持hash join，但可以配合应用端自己模拟，理论上效果要好于临时表的方案。


















