---
title: 6-3lambda表达式
date: 2024-04-23 15:59:45
tags:
description:  函数式接口、JAVA提供的通用函数式接口
---

### 函数式接口
对于只有一个抽象方法的接口， 需要这种接口的对象时，就可以提供一个 lambda表达式。这种接口称为函数式接口 （ functional interface )。

在 Java 中， 对 lambda 表达式所能做的也只是能转换为函数式接口。其他支持函数字面量的语言中，可以声明函数类型（如（String, String) -> int)、 声明这些类型的变量，使用变量保存函数表达式（如C#委托）。不过，Java 设计者决定保持接口概念， 没有为 Java增加函数类型。

### 举例
Arrays.sort 第二个参数需要Comparator 实例对象， Comparator是只有一个方法的接口， 所以可以提供一个 lambda 表达式
```
Arrays.sort (words,
(first, second) -> first.lengthO - second.lengthO) ;
```

### JAVA提供的通用函数式接口
Java API 在java.util.fimction 包中定义了很多非常通用的函数式接口
BiFunction<T, U, R> 描述了参数类型为 T 和 U 而且返回类型为 R 的函数.可以把我们的字符串比较 lambda 表达式保存在这个类型的变量中：
```
BiFunction<String, String, Integer〉comp
= (first, second) -> first.lengthO - second.length();
```
java.util.function 包中有一个尤其有用的接口 Predicate:
```
public interface Predicate<T>
{
boolean test(T t);
// Additional default and static methods
}
```
ArrayList 类有一个 removelf 方法， 它的参数就是一个 Predicate。下面的语句将从一个数组列表删除所有 null 值：
```list.removelf(e -> e == null);```


### 方法引用
要用 :: 操作符分隔方法名与对象或类名。主要有 3 种情况：
- object::instanceMethod
- Class::staticMethod
- Class.instanceMethod 第 1 个参数会成为方法的目标。
    例如：String::compareToIgnoreCase 等同于 (x, y) -> x.compareToIgnoreCase(y)
### 构造器引用
```
ArrayList<String> names = . . .;
Stream<Person> stream = names.stream().map(Person::new);
List<Person> people = stream.col1ect(Col1ectors.toList());

Object[] people = stream.toArrayO；
Person[] people = stream.toArray(Person[]::new):
```

### 变量作用域

```
 public static void repeatMsg(String text, int delay) {

        ActionListener listener = event -> {
            System.out.println(text);
            Toolkit.getDefaultToolkit().beep();
        };

        new Timer(delay, listener).start();
    }
```
lambda 表达式有3个部分：
- 一个代码块
- 参数
- 自由变量的值， 这是指非参数而且不在代码中定义的变量 (上例的text变量)

自由变量的限制：lambda 表达式可以捕获外围作用域中变量的值，但引用值不能改变的变量。
限制原因：避免并发产生的数据一致性问题

<b>lambda表达式中的this关键字</b>指创建这个 lambda 表达式的方法的 this参数。
```
public class ApplicationO
    {
        public void init()
        {
            ActionListener listener * event ->
            {
                System.out.print n(this.toString());
                ...
            }
            ...
        }
    }
```
表达式 this.toString()会调用 Application 对象的 toString方法， 而不是 ActionListener 实
例的方法。

### 处理lambda表达式
常用函数式接口
![](6-3-1.png)
基本类型的函数式接口
![](6-3-2.png)
使用时注意<b>避免装箱拆箱</b>，如根据实际情况选择使用 IntConsumer 还是Consume<lnteger>

用 @FunctionalInterface 注解来标记只有一个抽象方法的接口
两个优点：
- 无意中增加了另一个非抽象方法， 编译器会产生一个错误消息
- javadoc 页里会指出你的接口是一个函数式接口    

### 再谈Comparator
```
Arrays.sort(arr, Comparator.comparing(Person::getName, Comparator.comparingInt(String::length).reversed()).thenComparing(Person::getlName, Comparator.nullsLast(Comparator.comparingInt(String::length).reversed())));
```
排序规则：
根据Name长度倒序，长度大在前
根据lName长度倒序，长度大在前，为空在最后。