+++ 
draft = false
date = 2022-03-26T14:23:00+08:00
title = "Sort Custom Object in Java"
description = ""
slug = ""
authors = []
tags = []
categories = []
externalLink = ""
series = []
+++


1. Define a custom POJO, like this:

    ```java
    package com.example.models;

    public class ManufacturerPrice {

        private String name;

        private String description;

        // ... ommit setters & getters
    }
    ```

2. Define a Comparator variable, like this:

    ```java
    Comparator<ManufacturerPrice> priceComparator =
                (a, b) -> a.getName().compareTo(b.getName());
    ```

3. Use `Collections.sort` with your custom Comparator, like this:

    ```java
    // entities is a Collection of ManufacturerPrice, such as List, Set, etc.
    Collections.sort(entities, priceComparator);
    ```
