// NRG ENGINE 2.0 — Supported Languages Catalog
export const LANGUAGES = {
      c: {
        id: 'c',
        name: 'C',
        badge: 'C',
        badgeBg: '#0066ff',
        compiler: 'C (GCC 14.1.0)',
        file: 'main.c',
        template: `#include <stdio.h>

int main() {
    printf("Hello, NRG Engine!\\n");
    return 0;
}`
      },
      cpp: {
        id: 'cpp',
        name: 'C++',
        badge: 'C++',
        badgeBg: '#0066ff',
        compiler: 'C++ (GCC 14.1.0)',
        file: 'main.cpp',
        template: `#include <iostream>

int main() {
    std::cout << "Hello, NRG Engine from C++!" << std::endl;
    return 0;
}`
      },
      java: {
        id: 'java',
        name: 'Java',
        badge: '☕',
        badgeBg: '#ef4444',
        compiler: 'Java (JDK 17.0.6)',
        file: 'Main.java',
        template: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, NRG Engine from Java!");
    }
}`
      },
      python: {
        id: 'python',
        name: 'Python',
        badge: '🐍',
        badgeBg: 'linear-gradient(135deg, #0284c7 50%, #eab308 50%)',
        compiler: 'Python (3.12.5)',
        file: 'main.py',
        template: `def main():
    print("Hello, NRG Engine from Python!")

if __name__ == "__main__":
    main()`
      },
      javascript: {
        id: 'javascript',
        name: 'JavaScript',
        badge: 'JS',
        badgeBg: '#eab308',
        compiler: 'JavaScript (Node.js 22.08)',
        file: 'script.js',
        template: `function main() {
    console.log("Hello, NRG Engine from JavaScript!");
}

main();`
      },
      csharp: {
        id: 'csharp',
        name: 'C#',
        badge: 'C#',
        badgeBg: '#7c3aed',
        compiler: 'C# (Mono 6.6.0)',
        file: 'Program.cs',
        template: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, NRG Engine from C#!");
    }
}`
      },
      go: {
        id: 'go',
        name: 'Go',
        badge: '-GO',
        badgeBg: '#06b6d4',
        compiler: 'Go (1.23.5)',
        file: 'main.go',
        template: `package main

import "fmt"

func main() {
    fmt.Println("Hello, NRG Engine from Go!")
}`
      },
      rust: {
        id: 'rust',
        name: 'Rust',
        badge: '⚙',
        badgeBg: '#b45309',
        compiler: 'Rust (rustc 1.85.0)',
        file: 'main.rs',
        template: `fn main() {
    println!("Hello, NRG Engine from Rust!");
}`
      },
      php: {
        id: 'php',
        name: 'PHP',
        badge: 'php',
        badgeBg: '#6366f1',
        compiler: 'PHP (8.3.11)',
        file: 'index.php',
        template: `<?php
echo "Hello, NRG Engine from PHP!\\n";
?>`
      },
      kotlin: {
        id: 'kotlin',
        name: 'Kotlin',
        badge: 'K',
        badgeBg: 'linear-gradient(135deg, #a855f7, #ec4899)',
        compiler: 'Kotlin (2.1.10)',
        file: 'Main.kt',
        template: `fun main() {
    println("Hello, NRG Engine from Kotlin!")
}`
      }
    };;
