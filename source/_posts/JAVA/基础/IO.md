---
title: IO
date: 2024-06-18 16:49:42
tags:
    - JAVA
    - IO流
description: JAVA IO基础类
---

# File 类

## 比较
```
String fileName = "d:" + File.separator + "b.txt";
File f1 = new File(fileName);
File f2 = new File(fileName);
System.out.println(f1 == f2); // false  比较引用
System.out.println(f1.equals(f2)); // true 比较文件路径
```
# InputStream、OutputStream、Reader、Writer
字节流：InputStream、OutputStream
字符流（处理文本）：Reader、Writer

节点流：可单独处理数据
处理流：依赖其他流处理数据

## 问题

文本文件a.txt内容如下：
```
12
34
```
读取a.txt内容时每次读取三个字符输出不正确
```
char[] buffer = new char[3];
int len;
while ((len = fileReader.read(buffer, 0, buffer.length)) > -1) {
    System.out.println(new String(buffer, 0, len) + ":");
}
```
# InputStreamReader、OutputStreamWriter
转换流：转换字节流和字符流
```
public static void IOStreamRW() throws IOException {
        String fileName = "d:" + File.separator + "a.txt";
        String newFileName = "d:" + File.separator + "new.txt";
        FileInputStream fis = new FileInputStream(fileName);
        //InputStreamReader isr = new InputStreamReader(fis);
        InputStreamReader isr = new InputStreamReader(fis, "GBK");//默认utf-8  windows记事本显示ANSI表示使用系统编码（我的电脑是GBK）
        BufferedReader br = new BufferedReader(isr);

        FileOutputStream fos = new FileOutputStream(newFileName);
        OutputStreamWriter osw = new OutputStreamWriter(fos, "utf-8");
        BufferedWriter bw = new BufferedWriter(osw);

        int r;
        char[] chars = new char[1024];

        /**
         * 1
         */
        //while ((r = isr.read(chars, 0, chars.length)) > -1) {
        //    osw.write(chars, 0, r);
        //}
        //osw.close();
        //isr.close();

        /**
         * 2 bufferedReader、bufferedWriter
         */
        while ((r = br.read(chars, 0, chars.length)) > -1) {
            bw.write(chars, 0, r);
        }
        bw.close();
        br.close();

    }
```

# DataInputStream、DataOutputStream
数据流：处理基本数据类型和字符串
```
public static void DataIOputStream() throws IOException {
        String fileName = "d:" + File.separator + "s.txt";
        File file = new File(fileName);
        FileOutputStream fos = new FileOutputStream(file);
        DataOutputStream dos = new DataOutputStream(fos);
        dos.writeUTF("你好哈哈");
        dos.writeInt(10);
        dos.writeBoolean(true);
        dos.writeDouble(1.98);
        dos.writeUTF("你好嘻嘻");

        FileInputStream fis = new FileInputStream(file);
        DataInputStream dis = new DataInputStream(fis);
        //按顺序读取
        System.out.println(dis.readUTF());
        System.out.println(dis.readInt());
        System.out.println(dis.readBoolean());
        System.out.println(dis.readDouble());
        System.out.println(dis.readUTF());
    }
```

# ObjectOutputStream、ObjectInputStream
对象流做序列化反序列化


```
public  static void ObjectIOputStream() throws IOException, ClassNotFoundException {
        String fileName = "d:" + File.separator + "ois.txt";
        ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream(fileName));
        ObjectInputStream ois = new ObjectInputStream(new FileInputStream(fileName));
        oos.writeObject(new Person(1, "vvf"));
        oos.close();

        System.out.println(ois.readObject());
    }


```

声明serialVersionUID 说明版本兼容性问题（默认会自动生成，修改类时会发生变化）
```
class Person implements Serializable{
    public Person() {
    }

    private static final long serialVersionUID = 643382323274886977L;

    public Person(int age, String name) {
        this.age = age;
        this.name = name;
    }

    int age;
    String name;

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    //@Override
    //public String toString() {
    //    return "Person{" +
    //            "age=" + age +
    //            ", name='" + name + '\'' +
    //            '}';
    //}
}
```

`transient` 修饰不可序列化的属性
静态属性也不会被序列化

# RandomAccessFile
分段读取文件