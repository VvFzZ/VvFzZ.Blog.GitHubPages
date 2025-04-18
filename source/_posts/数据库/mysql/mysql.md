---
title: mysql
date: 2024-06-21 22:51:42
tags: mysql
description:
---
思考每句sql语句的执行逻辑，评估最好情况的资源消耗,避免低级错误

# 简单介绍
1. 开源
2. 跨平台
3. 轻量级
4. 成本低
<!--more-->
# 安装
## windows
登录命令： mysql -hlocalhost -uroot -p
显示数据库：show databases
使用某一数据库：use db_name
展示表：show tables
退出：quit ，exit ，\q
设置密码不过期：alter user'root'@'localhost' identified by 'root'password expire never;
设置密码加密规则： alter user 'root'@'localhost' identified with mysql_native_password by 'root'
## linux
.

# 数据类型
## 数值类型
- TINYINT  1 Bytes (-128，127)	(0，255)
- SMALLINT 2 Bytes	(-32 768，32 767)	(0，65 535)
- MEDIUMINT 3 Bytes	(-8 388 608，8 388 607)	(0，16 777 215)
- INT/INTEGER 4 Bytes	(-2 147 483 648，2 147 483 647)	(0，4 294 967 295)
int(10)表示显示长度
CREATE TABLE t1 (c1 INT(4) ZEROFILL //存储10 显示0010
);
- BIGINT 8 Bytes
- FLOAT	4 Bytes
- DOUBLE	8 Bytes
- DECIMAL
- binary 定长 索引查询效率高，可能浪费空间
- varbinary 变长，充分利用空间，查询效率低于binary，要计算长度信息
## 日期和时间类型
类型	大小( bytes)	范围	格式	用途
- DATE	3	1000-01-01/9999-12-31	YYYY-MM-DD	日期值
- TIME	3	'-838:59:59'/'838:59:59'	HH:MM:SS	时间值或持续时间
- YEAR	1	1901/2155	YYYY	年份值
- DATETIME	8	'1000-01-01 00:00:00' 到 '9999-12-31 23:59:59'	YYYY-MM-DD hh:mm:ss	混合日期和时间值
- TIMESTAMP	4	'1970-01-01 00:00:01' UTC 到 '2038-01-19 03:14:07' UTC结束时间是第 2147483647 秒，北京时间 2038-1-19 11:14:07，格林尼治时间 2038年1月19日 凌晨 03:14:07 YYYY-MM-DD hh:mm:ss	混合日期和时间值，时间戳

查询当前时间：`select now(),sysdate(),CURRENT_DATE();`
## 字符串类型
- CHAR	0-255 bytes	定长字符串
最大255个字符，定长性能高
- VARCHAR	0-65535 bytes	变长字符串
最大长度限制65535字节（MySQL中单行数据的总大小不能超过65535字节包括所有列的长度信息和实际数据）
varchar(255)表示可存储255个字符
实际可存储的字符数取决于字符集：
latin1字符集（每个字符 1 字节），最大长度为65535字符。
utf8mb4字符集（每个字符最多 4 字节），最大长度为16383字符（65,535/4）。

如果长度小于等于255字节，1个字节存储长度信息，长度大于255字节，2个字节
- NVARCHAR
N代表Unicode字符
nvarchar(20)可存储20个字符，可以存储20个字母或20个汉字（每个都占用两字节）

- TINYBLOB	0-255 bytes	不超过 255 个字符的二进制字符串
- TINYTEXT	0-255 bytes	短文本字符串
- BLOB	0-65 535 bytes	二进制形式的长文本数据
- TEXT	0-65 535 bytes	长文本数据
- MEDIUMBLOB	0-16 777 215 bytes	二进制形式的中等长度文本数据
- MEDIUMTEXT	0-16 777 215 bytes	中等长度文本数据
- LONGBLOB	0-4 294 967 295 bytes	二进制形式的极大文本数据
- LONGTEXT	0-4 294 967 295 bytes	极大文本数据
## 枚举与集合类型（Enumeration and Set Types）
- ENUM: 枚举类型，用于存储单一值，可以选择一个预定义的集合。
- SET: 集合类型，用于存储多个值，可以选择多个预定义的集合。
## 空间数据类型（Spatial Data Types）
GEOMETRY, POINT, LINESTRING, POLYGON, MULTIPOINT, MULTILINESTRING, MULTIPOLYGON, GEOMETRYCOLLECTION: 用于存储空间数据（地理信息、几何图形等）。

# 三范式
- 列原子性
- 数据与联合主键完全相关性
- 数据和主键直接相关性

# DDL
- 新建库
create database db1;

show create table vvf.v_user\G
- 新建表
```
CREATE TABLE player (
  id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'id',
  create_time datetime not null default CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;
```
反引号避免和保留字段冲突
utf8_general_ci大小写不敏感，utf8_bin敏感

- 增加列 
alter table table_name add column column_name first; // 增加一列，放在最前面
alter table table_name add column column_name after id;//增加一列放在id列后
- 删除列
alter table table_name drop column_name; 要写日志所以慢
- 修改列
alter table table_name modify  column_name type; 只修改类型
alter table table_name change old_column_name new_column_name type; 修改列明和类型
ALTER TABLE player RENAME COLUMN age to player_age
- 索引
SHOW INDEX FROM table_name;
创建索引
CREATE INDEX index_name ON table_name(column_name);
ALTER TABLE table_name ADD PRIMARY KEY (column_name);
CREATE INDEX index_name ON table_name(column1, column2);
CREATE UNIQUE INDEX index_name ON table_name(column_name);
CREATE INDEX index_name ON table_name(column_name(10)); -- 只索引前10个字符
删除索引
DROP INDEX index_name ON table_name;
ALTER TABLE table_name DROP PRIMARY KEY;


- 复制表
    1. create table new_table as select * from old_table;
    2. 不复制数据 create table new_table as select * from old_table where 1=2; //创建表后新加的约束没有复制到新表
    3. create table new_table as select name,add from old_table where age < 20;
- truncate table_anme 删除数据，（删除表然后新建表）

查看表详细信息 desc table_name；

# 完整性约束
- PRIMARY KEY 主键 
alter table table_name add primary key(column_name)
- NOT NULL 非空 
- UNIQUE 唯一
alter table user add [constraint name] unique (columen_name)
alter table drop index index_name
- CHECK 检查
- DEFAULT 默认值
- AUTO_INCREMENT 自增
添加自增 alter table 【数据库名.】表名称 modify 字段名 数据类型 auto_increment;
取消自增 alter table 【数据库名.】表名称 modify 字段名 数据类型;
- FOREIGN KEY 外键
alter table talbe_name add constraint  fk_name foreign key(column_name) reference table_name(column_name)
```
#列级约束
create table us(
    no int(6) primary key auto_index,
    anme varchar(5) not null,
    sex char(1) default '男' check(sex = '男 || sex='女')，
    age int(3) check(age>18 and age <30),
    email varchar(15) unique
)

#表级约束
create table us(
    no int(6) auto_increment,
    anme varchar(5) not null,
    sex char(1) default '男' )，
    age int(3) ,
    email varchar(15),
    class_name varchar(15),
    constraint primary_key primary key(no),
    constraint check_sex check(sex='男' || sex = '女'),
    constraint unique_email unique(email),
    constraint fk_class_name foreign key(class_name) reference class(name)
)
```

# 函数
##  字符串函数
- ASCII(s)	返回字符串 s 的第一个字符的 ASCII 码。	
返回 CustomerName 字段第一个字母的 ASCII 码：

SELECT ASCII(CustomerName) AS NumCodeOfFirstChar
FROM Customers;
- CHAR_LENGTH(s)	返回字符串 s 的字符数	
返回字符串 RUNOOB 的字符数

SELECT CHAR_LENGTH("RUNOOB") AS LengthOfString;
- CHARACTER_LENGTH(s)	返回字符串 s 的字符数，等同于 CHAR_LENGTH(s)	
返回字符串 RUNOOB 的字符数

SELECT CHARACTER_LENGTH("RUNOOB") AS LengthOfString;
- CONCAT(s1,s2...sn)	字符串 s1,s2 等多个字符串合并为一个字符串	
合并多个字符串

SELECT CONCAT("SQL ", "Runoob ", "Gooogle ", "Facebook") AS ConcatenatedString;
- CONCAT_WS(x, s1,s2...sn)	同 CONCAT(s1,s2,...) 函数，但是每个字符串之间要加上 x，x 可以是分隔符	
合并多个字符串，并添加分隔符：

SELECT CONCAT_WS("-", "SQL", "Tutorial", "is", "fun!")AS ConcatenatedString;
- FIELD(s,s1,s2...)	返回第一个字符串 s 在字符串列表(s1,s2...)中的位置	
返回字符串 c 在列表值中的位置：

SELECT FIELD("c", "a", "b", "c", "d", "e");
- FIND_IN_SET(s1,s2)	返回在字符串s2中与s1匹配的字符串的位置	
返回字符串 c 在指定字符串中的位置：

SELECT FIND_IN_SET("c", "a,b,c,d,e");
- FORMAT(x,n)	函数可以将数字 x 进行格式化 "#,###.##", 将 x 保留到小数点后 n 位，最后一位四舍五入。	
格式化数字 "#,###.##" 形式：

SELECT FORMAT(250500.5634, 2);     -- 输出 250,500.56
- INSERT(s1,x,len,s2)	字符串 s2 替换 s1 的 x 位置开始长度为 len 的字符串	
从字符串第一个位置开始的 6 个字符替换为 runoob：

SELECT INSERT("google.com", 1, 6, "runoob");  -- 输出：runoob.com
- LOCATE(s1,s)	从字符串 s 中获取 s1 的开始位置	
获取 b 在字符串 abc 中的位置：

SELECT LOCATE('st','myteststring');  -- 5
返回字符串 abc 中 b 的位置：

SELECT LOCATE('b', 'abc') -- 2
- LCASE(s)	将字符串 s 的所有字母变成小写字母	
字符串 RUNOOB 转换为小写：

SELECT LCASE('RUNOOB') -- runoob
- LEFT(s,n)	返回字符串 s 的前 n 个字符	
返回字符串 runoob 中的前两个字符：

SELECT LEFT('runoob',2) -- ru
- LOWER(s)	将字符串 s 的所有字母变成小写字母	
字符串 RUNOOB 转换为小写：

SELECT LOWER('RUNOOB') -- runoob
- LPAD(s1,len,s2)	在字符串 s1 的开始处填充字符串 s2，使字符串长度达到 len	
将字符串 xx 填充到 abc 字符串的开始处：

SELECT LPAD('abc',5,'xx') -- xxabc
- LTRIM(s)	去掉字符串 s 开始处的空格	
去掉字符串 RUNOOB开始处的空格：

SELECT LTRIM("    RUNOOB") AS LeftTrimmedString;-- RUNOOB
- MID(s,n,len)	从字符串 s 的 n 位置截取长度为 len 的子字符串，同 SUBSTRING(s,n,len)	
从字符串 RUNOOB 中的第 2 个位置截取 3个 字符：

SELECT MID("RUNOOB", 2, 3) AS ExtractString; -- UNO
- POSITION(s1 IN s)	从字符串 s 中获取 s1 的开始位置	
返回字符串 abc 中 b 的位置：

SELECT POSITION('b' in 'abc') -- 2
- REPEAT(s,n)	将字符串 s 重复 n 次	
将字符串 runoob 重复三次：

SELECT REPEAT('runoob',3) -- runoobrunoobrunoob
- REPLACE(s,s1,s2)	将字符串 s2 替代字符串 s 中的字符串 s1	
将字符串 abc 中的字符 a 替换为字符 x：

SELECT REPLACE('abc','a','x') --xbc
- REVERSE(s)	将字符串s的顺序反过来	
将字符串 abc 的顺序反过来：

SELECT REVERSE('abc') -- cba
- RIGHT(s,n)	返回字符串 s 的后 n 个字符	
返回字符串 runoob 的后两个字符：

SELECT RIGHT('runoob',2) -- ob
- RPAD(s1,len,s2)	在字符串 s1 的结尾处添加字符串 s2，使字符串的长度达到 len	
将字符串 xx 填充到 abc 字符串的结尾处：

SELECT RPAD('abc',5,'xx') -- abcxx
- RTRIM(s)	去掉字符串 s 结尾处的空格	
去掉字符串 RUNOOB 的末尾空格：

SELECT RTRIM("RUNOOB     ") AS RightTrimmedString;   -- RUNOOB
- SPACE(n)	返回 n 个空格	
返回 10 个空格：

SELECT SPACE(10);
- STRCMP(s1,s2)	比较字符串 s1 和 s2，如果 s1 与 s2 相等返回 0 ，如果 s1>s2 返回 1，如果 s1<s2 返回 -1	
比较字符串：

SELECT STRCMP("runoob", "runoob");  -- 0
- SUBSTR(s, start, length)	从字符串 s 的 start 位置截取长度为 length 的子字符串	
从字符串 RUNOOB 中的第 2 个位置截取 3个 字符：

SELECT SUBSTR("RUNOOB", 2, 3) AS ExtractString; -- UNO
- SUBSTRING(s, start, length)	从字符串 s 的 start 位置截取长度为 length 的子字符串，等同于 SUBSTR(s, start, length)	
从字符串 RUNOOB 中的第 2 个位置截取 3个 字符：

SELECT SUBSTRING("RUNOOB", 2, 3) AS ExtractString; -- UNO
- SUBSTRING_INDEX(s, delimiter, number)	返回从字符串 s 的第 number 个出现的分隔符 delimiter 之后的子串。
如果 number 是正数，返回第 number 个字符左边的字符串。
如果 number 是负数，返回第(number 的绝对值(从右边数))个字符右边的字符串。	
SELECT SUBSTRING_INDEX('a*b','*',1) -- a
SELECT SUBSTRING_INDEX('a*b','*',-1)    -- b
SELECT SUBSTRING_INDEX(SUBSTRING_INDEX('a*b*c*d*e','*',3),'*',-1)    -- c
- TRIM(s)	去掉字符串 s 开始和结尾处的空格	
去掉字符串 RUNOOB 的首尾空格：

SELECT TRIM('    RUNOOB    ') AS TrimmedString;
- UCASE(s)	将字符串转换为大写	
将字符串 runoob 转换为大写：

SELECT UCASE("runoob"); -- RUNOOB
- UPPER(s)	将字符串转换为大写	
将字符串 runoob 转换为大写：

SELECT UPPER("runoob"); -- RUNOOB
## 数字函数
- ABS(x)	返回 x 的绝对值　　	
返回 -1 的绝对值：

SELECT ABS(-1) -- 返回1
- ACOS(x)	求 x 的反余弦值（单位为弧度），x 为一个数值	
SELECT ACOS(0.25);
- ASIN(x)	求反正弦值（单位为弧度），x 为一个数值	
SELECT ASIN(0.25);
- ATAN(x)	求反正切值（单位为弧度），x 为一个数值	
SELECT ATAN(2.5);
- ATAN2(n, m)	求反正切值（单位为弧度）	
SELECT ATAN2(-0.8, 2);
- AVG(expression)	返回一个表达式的平均值，expression 是一个字段	
返回 Products 表中Price 字段的平均值：

SELECT AVG(Price) AS AveragePrice FROM Products;
- CEIL(x)	返回大于或等于 x 的最小整数　	
SELECT CEIL(1.5) -- 返回2
- CEILING(x)	返回大于或等于 x 的最小整数　	
SELECT CEILING(1.5); -- 返回2
- COS(x)	求余弦值(参数是弧度)	
SELECT COS(2);
- COT(x)	求余切值(参数是弧度)	
SELECT COT(6);
- COUNT(expression)	返回查询的记录总数，expression 参数是一个字段或者 * 号	
返回 Products 表中 products 字段总共有多少条记录：

SELECT COUNT(ProductID) AS NumberOfProducts FROM Products;
- DEGREES(x)	将弧度转换为角度　　	
SELECT DEGREES(3.1415926535898) -- 180
- n DIV m	整除，n 为被除数，m 为除数	
计算 10 除于 5：

SELECT 10 DIV 5;  -- 2
- EXP(x)	返回 e 的 x 次方　　	
计算 e 的三次方：

SELECT EXP(3) -- 20.085536923188
- FLOOR(x)	返回小于或等于 x 的最大整数　　	
小于或等于 1.5 的整数：

SELECT FLOOR(1.5) -- 返回1
- GREATEST(expr1, expr2, expr3, ...)	返回列表中的最大值	
返回以下数字列表中的最大值：

SELECT GREATEST(3, 12, 34, 8, 25); -- 34
返回以下字符串列表中的最大值：

SELECT GREATEST("Google", "Runoob", "Apple");   -- Runoob
- LEAST(expr1, expr2, expr3, ...)	返回列表中的最小值	
返回以下数字列表中的最小值：

SELECT LEAST(3, 12, 34, 8, 25); -- 3
返回以下字符串列表中的最小值：

SELECT LEAST("Google", "Runoob", "Apple");   -- Apple
- LN	返回数字的自然对数，以 e 为底。	
返回 2 的自然对数：

SELECT LN(2);  -- 0.6931471805599453
- LOG(x) 或 LOG(base, x)	返回自然对数(以 e 为底的对数)，如果带有 base 参数，则 base 为指定带底数。　　	
SELECT LOG(20.085536923188) -- 3
SELECT LOG(2, 4); -- 2
- LOG10(x)	返回以 10 为底的对数　　	
SELECT LOG10(100) -- 2
- LOG2(x)	返回以 2 为底的对数	
返回以 2 为底 6 的对数：

SELECT LOG2(6);  -- 2.584962500721156
- MAX(expression)	返回字段 expression 中的最大值	
返回数据表 Products 中字段 Price 的最大值：

SELECT MAX(Price) AS LargestPrice FROM Products;
- MIN(expression)	返回字段 expression 中的最小值	
返回数据表 Products 中字段 Price 的最小值：

SELECT MIN(Price) AS MinPrice FROM Products;
- MOD(x,y)	返回 x 除以 y 以后的余数　	
5 除于 2 的余数：

SELECT MOD(5,2) -- 1
- PI()	返回圆周率(3.141593）　　	
SELECT PI() --3.141593
- POW(x,y)	返回 x 的 y 次方　	
2 的 3 次方：

SELECT POW(2,3) -- 8
- POWER(x,y)	返回 x 的 y 次方　	
2 的 3 次方：

SELECT POWER(2,3) -- 8
- RADIANS(x)	将角度转换为弧度　　	
180 度转换为弧度：

SELECT RADIANS(180) -- 3.1415926535898
- RAND()	返回 0 到 1 的随机数　　	
SELECT RAND() --0.93099315644334
- ROUND(x [,y])	返回离 x 最近的整数，可选参数 y 表示要四舍五入的小数位数，如果省略，则返回整数。	
SELECT ROUND(1.23456) --1

SELECT ROUND(345.156, 2) -- 345.16
- SIGN(x)	返回 x 的符号，x 是负数、0、正数分别返回 -1、0 和 1　	
SELECT SIGN(-10) -- (-1)
- IN(x)	求正弦值(参数是弧度)　　	
SELECT SIN(RADIANS(30)) -- 0.5
- SQRT(x)	返回x的平方根　　	
25 的平方根：

SELECT SQRT(25) -- 5
- SUM(expression)	返回指定字段的总和	
计算 OrderDetails 表中字段 Quantity 的总和：

SELECT SUM(Quantity) AS TotalItemsOrdered FROM OrderDetails;
- TAN(x)	求正切值(参数是弧度)	
SELECT TAN(1.75);  -- -5.52037992250933
- TRUNCATE(x,y)	返回数值 x 保留到小数点后 y 位的值（与 ROUND 最大的区别是不会进行四舍五入）	
SELECT TRUNCATE(1.23456,3) -- 1.234
## 日期函数
- ADDDATE(d,n)	计算起始日期 d 加上 n 天的日期	
SELECT ADDDATE("2017-06-15", INTERVAL 10 DAY);
->2017-06-25
- ADDTIME(t,n)	n 是一个时间表达式，时间 t 加上时间表达式 n	
加 5 秒：

SELECT ADDTIME('2011-11-11 11:11:11', 5);
->2011-11-11 11:11:16 (秒)
添加 2 小时, 10 分钟, 5 秒:

SELECT ADDTIME("2020-06-15 09:34:21", "2:10:5"); 
-> 2020-06-15 11:44:26
- CURDATE()	返回当前日期	
SELECT CURDATE();
-> 2018-09-19
- CURRENT_DATE()	返回当前日期	
SELECT CURRENT_DATE();
-> 2018-09-19
- CURRENT_TIME	返回当前时间	
SELECT CURRENT_TIME();
-> 19:59:02
- CURRENT_TIMESTAMP()	返回当前日期和时间	
SELECT CURRENT_TIMESTAMP()
-> 2018-09-19 20:57:43
- CURTIME()	返回当前时间	
SELECT CURTIME();
-> 19:59:02
- DATE()	从日期或日期时间表达式中提取日期值	
SELECT DATE("2017-06-15");    
-> 2017-06-15
- DATEDIFF(d1,d2)	计算日期 d1->d2 之间相隔的天数	
SELECT DATEDIFF('2001-01-01','2001-02-02')
-> -32
- DATE_ADD(d，INTERVAL expr type)	计算起始日期 d 加上一个时间段后的日期，type 值可以是：
MICROSECOND
SECOND
MINUTE
HOUR
DAY
WEEK
MONTH
QUARTER
YEAR
SECOND_MICROSECOND
MINUTE_MICROSECOND
MINUTE_SECOND
HOUR_MICROSECOND
HOUR_SECOND
HOUR_MINUTE
DAY_MICROSECOND
DAY_SECOND
DAY_MINUTE
DAY_HOUR
YEAR_MONTH
SELECT DATE_ADD("2017-06-15", INTERVAL 10 DAY);    
-> 2017-06-25

SELECT DATE_ADD("2017-06-15 09:34:21", INTERVAL 15 MINUTE);
-> 2017-06-15 09:49:21

SELECT DATE_ADD("2017-06-15 09:34:21", INTERVAL -3 HOUR);
->2017-06-15 06:34:21

SELECT DATE_ADD("2017-06-15 09:34:21", INTERVAL -3 MONTH);
->2017-03-15 09:34:21
- DATE_FORMAT(d,f)	按表达式 f的要求显示日期 d	
SELECT DATE_FORMAT('2011-11-11 11:11:11','%Y-%m-%d %r')
-> 2011-11-11 11:11:11 AM
- DATE_SUB(date,INTERVAL expr type)	函数从日期减去指定的时间间隔。	
Orders 表中 OrderDate 字段减去 2 天：

SELECT OrderId,DATE_SUB(OrderDate,INTERVAL 2 DAY) AS OrderPayDate
FROM Orders
- DAY(d)	返回日期值 d 的日期部分	
SELECT DAY("2017-06-15");  
-> 15
- DAYNAME(d)	返回日期 d 是星期几，如 Monday,Tuesday	
SELECT DAYNAME('2011-11-11 11:11:11')
->Friday
- DAYOFMONTH(d)	计算日期 d 是本月的第几天	
SELECT DAYOFMONTH('2011-11-11 11:11:11')
->11
- DAYOFWEEK(d)	日期 d 今天是星期几，1 星期日，2 星期一，以此类推	
SELECT DAYOFWEEK('2011-11-11 11:11:11')
->6
- DAYOFYEAR(d)	计算日期 d 是本年的第几天	
SELECT DAYOFYEAR('2011-11-11 11:11:11')
->315
- EXTRACT(type FROM d)	从日期 d 中获取指定的值，type 指定返回的值。
type可取值为：
MICROSECOND
SECOND
MINUTE
HOUR
DAY
WEEK
MONTH
QUARTER
YEAR
SECOND_MICROSECOND
MINUTE_MICROSECOND
MINUTE_SECOND
HOUR_MICROSECOND
HOUR_SECOND
HOUR_MINUTE
DAY_MICROSECOND
DAY_SECOND
DAY_MINUTE
DAY_HOUR
YEAR_MONTH
SELECT EXTRACT(MINUTE FROM '2011-11-11 11:11:11') 
-> 11
- FROM_DAYS(n)	计算从 0000 年 1 月 1 日开始 n 天后的日期	
SELECT FROM_DAYS(1111)
-> 0003-01-16
- HOUR(t)	返回 t 中的小时值	
SELECT HOUR('1:2:3')
-> 1
- LAST_DAY(d)	返回给给定日期的那一月份的最后一天	
SELECT LAST_DAY("2017-06-20");
-> 2017-06-30
- LOCALTIME()	返回当前日期和时间	
SELECT LOCALTIME()
-> 2018-09-19 20:57:43
- LOCALTIMESTAMP()	返回当前日期和时间	
SELECT LOCALTIMESTAMP()
-> 2018-09-19 20:57:43
- MAKEDATE(year, day-of-year)	基于给定参数年份 year 和所在年中的天数序号 day-of-year 返回一个日期	
SELECT MAKEDATE(2017, 3);
-> 2017-01-03
- MAKETIME(hour, minute, second)	组合时间，参数分别为小时、分钟、秒	
SELECT MAKETIME(11, 35, 4);
-> 11:35:04
- MICROSECOND(date)	返回日期参数所对应的微秒数	
SELECT MICROSECOND("2017-06-20 09:34:00.000023");
-> 23
- MINUTE(t)	返回 t 中的分钟值	
SELECT MINUTE('1:2:3')
-> 2
- MONTHNAME(d)	返回日期当中的月份名称，如 November	
SELECT MONTHNAME('2011-11-11 11:11:11')
-> November
- MONTH(d)	返回日期d中的月份值，1 到 12	
SELECT MONTH('2011-11-11 11:11:11')
->11
- NOW()	返回当前日期和时间	
SELECT NOW()
-> 2018-09-19 20:57:43
- PERIOD_ADD(period, number)	为 年-月 组合日期添加一个时段	
SELECT PERIOD_ADD(201703, 5);   
-> 201708
- PERIOD_DIFF(period1, period2)	返回两个时段之间的月份差值	
SELECT PERIOD_DIFF(201710, 201703);
-> 7
- QUARTER(d)	返回日期d是第几季节，返回 1 到 4	
SELECT QUARTER('2011-11-11 11:11:11')
-> 4
- SECOND(t)	返回 t 中的秒钟值	
SELECT SECOND('1:2:3')
-> 3
- SEC_TO_TIME(s)	将以秒为单位的时间 s 转换为时分秒的格式	
SELECT SEC_TO_TIME(4320)
-> 01:12:00
- STR_TO_DATE(string, format_mask)	将字符串转变为日期	
SELECT STR_TO_DATE("August 10 2017", "%M %d %Y");
-> 2017-08-10
- SUBDATE(d,n)	日期 d 减去 n 天后的日期	
SELECT SUBDATE('2011-11-11 11:11:11', 1)
->2011-11-10 11:11:11 (默认是天)
- SUBTIME(t,n)	时间 t 减去 n 秒的时间	
SELECT SUBTIME('2011-11-11 11:11:11', 5)
->2011-11-11 11:11:06 (秒)
- SYSDATE()	返回当前日期和时间	
SELECT SYSDATE()
-> 2018-09-19 20:57:43
- TIME(expression)	提取传入表达式的时间部分	
SELECT TIME("19:30:10");
-> 19:30:10
- TIME_FORMAT(t,f)	按表达式 f 的要求显示时间 t	
SELECT TIME_FORMAT('11:11:11','%r')
11:11:11 AM
- TIME_TO_SEC(t)	将时间 t 转换为秒	
SELECT TIME_TO_SEC('1:12:00')
-> 4320
- TIMEDIFF(time1, time2)	计算时间差值	
mysql> SELECT TIMEDIFF("13:10:11", "13:10:10");
-> 00:00:01
mysql> SELECT TIMEDIFF('2000:01:01 00:00:00',
    ->                 '2000:01:01 00:00:00.000001');
        -> '-00:00:00.000001'
mysql> SELECT TIMEDIFF('2008-12-31 23:59:59.000001',
    ->                 '2008-12-30 01:01:01.000002');
        -> '46:58:57.999999'
- TIMESTAMP(expression, interval)	单个参数时，函数返回日期或日期时间表达式；有2个参数时，将参数加和	
mysql> SELECT TIMESTAMP("2017-07-23",  "13:10:11");
-> 2017-07-23 13:10:11
mysql> SELECT TIMESTAMP('2003-12-31');
        -> '2003-12-31 00:00:00'
mysql> SELECT TIMESTAMP('2003-12-31 12:00:00','12:00:00');
        -> '2004-01-01 00:00:00'
- TIMESTAMPDIFF(unit,datetime_expr1,datetime_expr2)	计算时间差，返回 datetime_expr2 − datetime_expr1 的时间差	
mysql> SELECT TIMESTAMPDIFF(DAY,'2003-02-01','2003-05-01');   // 计算两个时间相隔多少天
        -> 89
mysql> SELECT TIMESTAMPDIFF(MONTH,'2003-02-01','2003-05-01');   // 计算两个时间相隔多少月
        -> 3
mysql> SELECT TIMESTAMPDIFF(YEAR,'2002-05-01','2001-01-01');    // 计算两个时间相隔多少年
        -> -1
mysql> SELECT TIMESTAMPDIFF(MINUTE,'2003-02-01','2003-05-01 12:05:55');  // 计算两个时间相隔多少分钟
        -> 128885
- TO_DAYS(d)	计算日期 d 距离 0000 年 1 月 1 日的天数	
SELECT TO_DAYS('0001-01-01 01:01:01')
-> 366
- WEEK(d)	计算日期 d 是本年的第几个星期，范围是 0 到 53	
SELECT WEEK('2011-11-11 11:11:11')
-> 45
- WEEKDAY(d)	日期 d 是星期几，0 表示星期一，1 表示星期二	
SELECT WEEKDAY("2017-06-15");
-> 3
- WEEKOFYEAR(d)	计算日期 d 是本年的第几个星期，范围是 0 到 53	
SELECT WEEKOFYEAR('2011-11-11 11:11:11')
-> 45
- YEAR(d)	返回年份	
SELECT YEAR("2017-06-15");
-> 2017
- YEARWEEK(date, mode)	返回年份及第几周（0到53），mode 中 0 表示周天，1表示周一，以此类推	
SELECT YEARWEEK("2017-06-15");
-> 201724
## 高级函数
- BIN(x)	返回 x 的二进制编码，x 为十进制数	
15 的 2 进制编码:

SELECT BIN(15); -- 1111
- BINARY(s)	将字符串 s 转换为二进制字符串	
SELECT BINARY "RUNOOB";
-> RUNOOB
- CASE expression
    WHEN condition1 THEN result1
    WHEN condition2 THEN result2
   ...
    WHEN conditionN THEN resultN
    ELSE result
END	CASE 表示函数开始，END 表示函数结束。如果 condition1 成立，则返回 result1, 如果 condition2 成立，则返回 result2，当全部不成立则返回 result，而当有一个成立之后，后面的就不执行了。	
SELECT CASE 
　　WHEN 1 > 0
　　THEN '1 > 0'
　　WHEN 2 > 0
　　THEN '2 > 0'
　　ELSE '3 > 0'
　　END
->1 > 0
- CAST(x AS type)	转换数据类型	
字符串日期转换为日期：

SELECT CAST("2017-08-29" AS DATE);
-> 2017-08-29
- COALESCE(expr1, expr2, ...., expr_n)	返回参数中的第一个非空表达式（从左向右）	
SELECT COALESCE(NULL, NULL, NULL, 'runoob.com', NULL, 'google.com');
-> runoob.com
- CONNECTION_ID()	返回唯一的连接 ID	
SELECT CONNECTION_ID();
-> 4292835
- CONV(x,f1,f2)	返回 f1 进制数变成 f2 进制数	
SELECT CONV(15, 10, 2);
-> 1111
- CONVERT(s USING cs)	函数将字符串 s 的字符集变成 cs	
SELECT CHARSET('ABC')
->utf-8    

SELECT CHARSET(CONVERT('ABC' USING gbk))
->gbk
- CURRENT_USER()	返回当前用户	
SELECT CURRENT_USER();
-> guest@%
- DATABASE()	返回当前数据库名	
SELECT DATABASE();   
-> runoob
- IF(expr,v1,v2)	如果表达式 expr 成立，返回结果 v1；否则，返回结果 v2。	
SELECT IF(1 > 0,'正确','错误')    
->正确
- IFNULL(v1,v2)	如果 v1 的值不为 NULL，则返回 v1，否则返回 v2。	
SELECT IFNULL(null,'Hello Word')
->Hello Word
- ISNULL(expression)	判断表达式是否为 NULL	
SELECT ISNULL(NULL);
->1
- LAST_INSERT_ID()	返回最近生成的 AUTO_INCREMENT 值	
SELECT LAST_INSERT_ID();
->6
- NULLIF(expr1, expr2)	比较两个字符串，如果字符串 expr1 与 expr2 相等 返回 NULL，否则返回 expr1	
SELECT NULLIF(25, 25);
->
- SESSION_USER()	返回当前用户	
SELECT SESSION_USER();
-> guest@%
- SYSTEM_USER()	返回当前用户	
SELECT SYSTEM_USER();
-> guest@%
- USER()	返回当前用户	
SELECT USER();
-> guest@%
- VERSION()	返回数据库的版本号	
SELECT VERSION()
-> 5.6.34

# 多行函数
min max avg sum count
count(column_name) 不包含为空的行
count(*)：包含为空的行

# 事务

`start transaction`
`rollback`
`commit`
## 并发问题
1. 脏读
2. 不可重复读
3. 幻读

### 脏读
一个事务读到另一个事务修改了但未提交的数据
### 不可重复读
同一个数据在一个事务中，不同时间读到不同的值
### 幻读
事务1读取多条记录，事务2插入几条记录，事务1在查询发现多了几条记录。

## 隔离级别
1. READ UNCOMMITED
2. READ COMMITED 
3. REPEATBLE READ （default)
4. SERIALIZABLE

查询当前隔离级别
select @@transaction_isolation;
修改当前会话隔离级别
set session transaction isolation level read uncommitted

# 视图
数据库中只存放视图的定义，没有存放数据，数据存放在原来的表中

## 优点
简化操作，不需关注表结构
数据保护

## 操作
### 新建
// 新建
create view view_name as
select * from t1
// 新建 若已存在替换
create or replace view view_name as
select * from t1
where t1.id <3 
with check option // 向视图插入时检查where条件

### 修改
每次改动只能涉及一个表，若条件字段与修改字段不在一张表修改失败

# 存储过程
## 语法
- create
```
create procedure proc1(in name varchar(10) ,out num int)
begin
    if name is null or name='' then
        select * from t1;
    else
        select * from t1 where tname = name;
    end if
    select found_rows() into num;
end
```
- 调用
```
call proc1(null)
call proc1('vvf1')
```
- 删除
```
drop procedure proc1;
```

# 一些问题
## 查询语句执行流程，执行顺序
FROM 子句组装数据
join on （小表驱动，join前驱动表加载时优先根据where条件使用索引过滤，被驱动表在join中使用where条件过滤）
WHERE 子句进行条件筛选；
GROUP BY 分组 ；
使用聚集函数进行计算；
HAVING 筛选分组；
计算所有的表达式；
SELECT 的字段；
ORDER BY 排序；
LIMIT 筛选。

##  EXISTS IN怎么选择
小表驱动原则
exists是外表驱动
in是内标驱动

# 内存相关
change buffer DML操作时 将操作记录到换成，等到数据页写入内存时再应用
redo log
undo log

# DELIMITER
mysql默认使用;作为结束符；在控制台执行多行语句时使用
临时定义新的 DELIMITER，新的结束符可以用（//）或者（$$）

```
DELIMITER //
CREATE PROCEDURE `add_num`(IN n INT)
BEGIN
       DECLARE i INT;
       DECLARE sum INT;
       
       SET i = 1;
       SET sum = 0;
       WHILE i <= n DO
              SET sum = sum + i;
              SET i = i +1;
       END WHILE;
       SELECT sum;
END //
DELIMITER ;
```

# 相关命令
show engines; 查看引擎




