---
title: 16OrderBy
description: 16OrderBy
date: 2025-03-13 11:38:27
tags: mysql
---
算法流程
- 全字段排序
- rowid排序

```
CREATE TABLE `t` (
 `id` int(11) NOT NULL,
 `city` varchar(16) NOT NULL,
 `name` varchar(16) NOT NULL,
 `age` int(11) NOT NULL,
 `addr` varchar(128) DEFAULT NULL,
 PRIMARY KEY (`id`),
 KEY `city` (`city`)
) ENGINE=InnoDB;
select city,name,age from t where city='杭州' order by name limit 1000 ;
```

# 全字段排序
全字段排序，在内存进行，目的是减少IO

根据city索引找到记录，逐行回表取到city,name,age放入内存排序取前1000，返回结果

当内存不足以存储所有数据时需用外存，若字段太多，内存可同时放入的行数少，分成的临时文件太多，排序性能差。

sort_buffer_size 参数控制用于排序的内存大小
number_of_tmp_files 表示排序过程中使用的临时文件数，外部排序一般使用归并排序算法


# rowid排序
根据city索引找到记录，逐行回表将name和id放入内存，排序后取前1000id，再**回表**取得完整数据，返回结果；

优化：建立联合索引(city,name，age) 索引中已排好序。




