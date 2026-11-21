function b64encode(str) { return Buffer.from(str, 'utf-8').toString('base64'); }
function b64decode(b64) { if (!b64) return ''; return Buffer.from(b64, 'base64').toString('utf-8'); }

const starterTemplates = {
  c: {
    id: 103,
    code: `#include <stdio.h>

int main() {
    printf("Hello, NRG Engine!\\n");
    return 0;
}`
  },
  cpp: {
    id: 105,
    code: `#include <iostream>

int main() {
    std::cout << "Hello, NRG Engine from C++!" << std::endl;
    return 0;
}`
  },
  java: {
    id: 91,
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, NRG Engine from Java!");
    }
}`
  },
  python: {
    id: 100,
    code: `def main():
    print("Hello, NRG Engine from Python!")

if __name__ == "__main__":
    main()`
  },
  javascript: {
    id: 102,
    code: `function main() {
    console.log("Hello, NRG Engine from JavaScript!");
}

main();`
  },
  csharp: {
    id: 51,
    code: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, NRG Engine from C#!");
    }
}`
  },
  go: {
    id: 107,
    code: `package main

import "fmt"

func main() {
    fmt.Println("Hello, NRG Engine from Go!")
} `
  },
  rust: {
    id: 108,
    code: `fn main() {
    println!("Hello, NRG Engine from Rust!");
}`
  },
  php: {
    id: 98,
    code: `<?php
echo "Hello, NRG Engine from PHP!\\n";
?>`
  },
  kotlin: {
    id: 111,
    code: `fun main() {
    println("Hello, NRG Engine from Kotlin!")
}`
  }
};

async function testAll() {
  for (const [lang, data] of Object.entries(starterTemplates)) {
    const res = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: data.id,
        source_code: b64encode(data.code)
      })
    });
    const result = await res.json();
    console.log(`[${lang.toUpperCase()}] Status: ${result.status?.description} | Stdout: ${b64decode(result.stdout).trim()} | Time: ${result.time}s | Mem: ${result.memory}KB`);
  }
}

testAll();
