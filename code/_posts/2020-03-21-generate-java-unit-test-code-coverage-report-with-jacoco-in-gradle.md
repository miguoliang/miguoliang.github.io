---
layout: post
title: Generate Java Unit Test Code Coverage Report with JaCoCo in Gradle
description: This is a starter guide for Java developers to generate and read a unit test code coverage report with JaCoCo in Gradle. People will learn the entire development workflow that includes starting a new Java project with Gradle, writing a simple unit test, running unit tests, generating unit tests, and reading the code coverage report.
image: /assets/2020-03-21-generate-java-unit-test-code-coverage-report-with-jacoco-in-gradle/banner.jpg
categories:
    - code
tags:
    - java
    - jacoco
    - unit test
    - code coverage
    - gradle
---

## Introduction

Code Coverage Report is critical for Java developers to measure their unit test work. Otherwise, developers know nothing about how many logic branches and codes are tested and how many not. Developers can found missing codes easily in a code coverage report, and a code coverage report can be a clue to help them improves their unit test work.

This article is a guide to help Java developers generate and read a code coverage report from zero. And I will use Visual Studio Code (VSCode) as the development tool, and you can use your favorite IDE or editors.

## Install Gradle

[Gradle](https://docs.gradle.org/current/userguide/userguide.html) is an open-source build automation tool focused on flexibility and performance. Gradle can be a alternative to [Maven](https://maven.apache.org/).

If you are working on macOS, you must know about a famous package management tool named [Homebrew](https://brew.sh/), but the version of Gradle is old in Homebrew repository. Therefore, I use [SDKMAN](https://sdkman.io/) to install Gradle globally.

```shell
sdk install gradle
```

**Note:** The latest Gradle version is 6.2.2 now.

Otherwise, you can learn other installation ways in [Gradle Installation Guide](https://docs.gradle.org/current/userguide/installation.html).

## Create an empty Java Project

Firstly, make an empty folder named *gradle-jacoco* and we will work in it.

```shell
mkdir gradle-jacoco
cd gradle-jacoco
```

Secondly, run Gradle setup command.

```shell
$ gradle init

Select type of project to generate:
  1: basic
  2: application
  3: library
  4: Gradle plugin
Enter selection (default: basic) [1..4] 2

Select implementation language:
  1: C++
  2: Groovy
  3: Java
  4: Kotlin
  5: Swift
Enter selection (default: Java) [1..5] 3

Select build script DSL:
  1: Groovy
  2: Kotlin
Enter selection (default: Groovy) [1..2] 1

Select test framework:
  1: JUnit 4
  2: TestNG
  3: Spock
  4: JUnit Jupiter
Enter selection (default: JUnit 4) [1..4] 4

Project name (default: gradle-jacoco):
Source package (default: gradle.jacoco):

> Task :init
Get more help with your project: https://docs.gradle.org/5.6.2/userguide/tutorial_java_projects.html

BUILD SUCCESSFUL in 27s
2 actionable tasks: 2 executed
```

**Note:** We use [JUnit Jupiter (JUnit 5)](https://junit.org/junit5/docs/current/user-guide/) in this guide.

Finally, a simple Java application project is generated.

![Directory Structure](/assets/2020-03-21-generate-java-unit-test-code-coverage-report-with-jacoco-in-gradle/directory-structure.jpg)

## Setup JaCoCo

Open *build.gradle*, and append `id jacoco` into the *plugin* block.

```groovy
plugins {
    // Apply the java plugin to add support for Java
    id 'java'

    // Apply the application plugin to add support for building a CLI application.
    id 'application'
    id 'jacoco' // HERE!
}
```

## Write a Simple Function to be Tested Later

Open and edit *App.java*.

```java
/*
 * This Java source file was generated by the Gradle 'init' task.
 */
package gradle.jacoco;

public class App {

    // To be tested!
    public String getAnAnimal(String animal) {

        if ("cat".equalsIgnoreCase(animal)) {
            return "Garfield";
        } else if ("dog".equalsIgnoreCase(animal)) {
            return "Odie";
        } else {
            return "Opps!";
        }
    }

    public String getGreeting() {
        return "Hello world.";
    }

    public static void main(String[] args) {
        System.out.println(new App().getGreeting());
    }
}
```

## Write a Unit Test Method

Open and edit *AppTest.java*

```java
/*
 * This Java source file was generated by the Gradle 'init' task.
 */
package gradle.jacoco;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AppTest {

    // Our test here!
    @Test
    void testGetAnAnimal() {
        assertEquals("Garfield", new App().getAnAnimal("cat"));
    }

    @Test
    void appHasAGreeting() {
        App classUnderTest = new App();
        assertNotNull(classUnderTest.getGreeting(), "app should have a greeting");
    }
}
```

## Run and Generate Code Coverage Report

Use the following command to clean the previous build result, run unit tests, and generate a code coverage report.

```shell
./gradlew clean test jacocoTestReport
```

The final code coverage report is saved in *build/reports/jacoco/test/html*. Developers can open *index.html* to open the report in a browser.

![Index of Code Coverage Report](/assets/2020-03-21-generate-java-unit-test-code-coverage-report-with-jacoco-in-gradle/index-code-coverage-report.jpg)

Besides, developers can locate to uncovered lines in a specific file easily.

![Uncovered Lines](/assets/2020-03-21-generate-java-unit-test-code-coverage-report-with-jacoco-in-gradle/uncovered-lines.jpg)

**Note:** The Code Coverage Report is generated when all unit tests pass, in another words, you can not find the code coverage report if any unit test fails.

## Conclusion

Developers should know how to measure their work, including progress, quality, and efficent. The code coverage report is useful, because it can make developers' review more effecient and effective. Therefore, developers can control their code completely with a code coverage report. However, 100% code coverage is ideal, especially it is impossible when you use some third-party library in your project, so that developers do not to be demanding.
