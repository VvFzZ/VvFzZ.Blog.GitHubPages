---
title: Stream库
date: 2024-05-23 08:35:07
tags: Stream
description:
---
使用步骤
- 创建 
- 转换为其他流的操作
- 终止操作，产生结果（执行之前的惰性操作）
<!--more-->
 {todo} ???
 `list.stream().parallel()`、 `list.parallelStream()`啥区别？

# 流的创建
Stream.of() 创建给定值的流
Stream.empty() 创建不包含元素的流
Stream.generate() 调用给定函数创建无限流
Stream.iterate() 根据种子和函数创建无限流
Pattern.compile("").splitAsStream() 创建由正则表达式界定的流
Arrays.stream(arr, 0, 1) 创建包含数组指定部分的流
Files.line() 创建包含指定文件中行的流
# filter、map和flatMap
filter 创建流，元素满足断言条件
map 创建流，将所有元素应用给定函数
flatMap  创建流，将指定函数应用于当前流中所有元素所产生的结果连接到一起而获得，（这里的每个结果都是一个流），如下：
```
Stream.of("1").flatMap(x -> {
            return Stream.of(x, x);
        }).forEach(System.out::println);
```
# 抽取子流和连接流
`stream.limit`
`stream.skip`
`Stream.concat` 连接两个流
# 其他的流转换
`distinct`
`sorted`
`peek(Consumer)` 获取每个元素时应用consumer，用于调试时可调用断点方法;count不会触发peek。

# 简单约简
终结操作：
- `min`
- `max`
- `findFirst` 与filter配合使用
- `findAny` 并行流与filter配合使用
- `anyMatch` 是否存在匹配，存在则返回true
- `allMatch` 全部匹配返回true
- `noneMatch` 没有匹配返回true

# Optinonal类型
一种对象包装器
orElse(defaultVal)  如空提供默认值
orElseGet(Supplier)   如空执行表达式获取默认值
orElseThrow(Exception)   如空抛出异常

ifPresent(Consumer) 
map(Function)
## 不适合使用Optional值的方式
1. `optionalVal.get()` 在值不存在时抛出异常
2. ``optionalVal.get().isPresent().get().someMethod();` 没有以下方式容易处理`if(value !=null ) value.someMethod()`

## 创建Optional值
`Optional.of(val)`
`Optional.empty()`
`Optional.ofNullable(val)` 若val为空则返回 `Optional.empty()`


## flatMap构建Optional值的函数

方法f返回值是Optional<T>
T对象有返回值是Optional<T>的方法g
使用如下方法连续调用：`s.f().flatMap(T::g)`
# 收集结果
## 遍历：
- foreach 在并行流上以任意顺序遍历元素
- foreachOrdered 按流中的顺序处理元素，但会丧失并行处理的部分甚至全部优势
## toArray
`toArray()` 返回`Object[]`
`ToArray(String::new)` 返回String数组.其他类型类似
## collect
`stream.collect(Collectors.toList())`
`stream.collect(Collectors.toSet())`
`stream.collect(Collectors.toCollection(TreeSet::new))` //指定结果类型`TreeSet`
`stream.collect(Collectors.join())`
`stream.collect(Collectors.join(","))`

统计
```
IntSummaryStatistics statistics = Arrays.asList("1", "132", "333", "434").stream().collect(Collectors.summarizingInt(String::length));
System.out.println("average:" + Statistics.getAverage());
System.out.println(Statistics.getMax());
```

# 收集结果到映射表
```
Person person = new Person("1", "11");
        Person person2 = new Person("2", "22");
        Person person3 = new Person("3", "33");
        Person person23 = new Person("23", "23");
        Arrays.asList(person2, person, person3).stream()
                .collect(Collectors.toMap(Person::getName, Person::getlName)).forEach((x, y) -> {
                    System.out.println(x + ":" + y);
                });

        Arrays.asList(person2, person, person3).stream()
                .collect(Collectors.toMap(Person::getName, Function.identity())).forEach((x, y) -> {
                    System.out.println(x + ":" + y);
                });

        Arrays.asList(person, person2, person3, person23).stream()
                .collect(Collectors.toMap(Person::getName, Function.identity(), (existingVal, newVal) -> {
                    return existingVal;
                })).forEach((x, y) -> {
                    System.out.println(x + ":" + y);
                });

        Arrays.asList(person3, person2, person, person23).stream()
                .collect(Collectors.toMap(Person::getName, Collections::singleton, (a, b) -> {
                    Set<Person> set = new HashSet<>(a);
                    set.addAll(b);
                    return set;
                }, TreeMap::new)).forEach((x, y) -> {
                    System.out.println(x + ":" + y);
                });
```
# 群组和分区
- `Collectors.groupingBy`
```
Map<String, List<Person>> collect = Arrays.asList(person1, person3_, person3, person2, person, person23).stream()
                .collect(Collectors.groupingBy(Person::getName));
map.forEach((x, y) -> {
            System.out.println(x + ":" + y);
        });
```
- `Collectors.partitionBy`
```
Map<Boolean, List<Person>> collect = Arrays.asList(person1, person3_, person3, person2, person, person23).stream()
                .collect(Collectors.partitioningBy(x -> x.getName().length() > 1));
collect.get(true).forEach(System.out::println);
```

