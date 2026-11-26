/**
 * NRG ENGINE — SHARED C/C++ COMPATIBILITY & EXECUTION LIMITS
 * Provides portable <conio.h> compatibility for Windows MinGW & Linux GCC/G++ (including Judge0),
 * line-number-preserving interactive stdio unbuffering, and standardized compile/execution timeouts.
 */

const COMPILE_TIMEOUT_MS = 10000;       // 10-second compilation timeout
const MAX_EXECUTION_TIMEOUT_MS = 30000; // 30-second maximum overall execution timeout
const INACTIVITY_TIMEOUT_MS = 30000;    // 30-second interactive input inactivity timeout

const CONIO_INCLUDE_REGEX = /^([ \t]*)#[ \t]*include[ \t]*[<"]conio\.h[>"][ \t]*(?:\/\/[^\r\n]*)?$/gm;

const CONIO_COMPAT_SHIM = `/* NRG Portable <conio.h> Compatibility Layer */
#ifndef __NRG_CONIO_H_COMPAT__
#define __NRG_CONIO_H_COMPAT__
#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#ifdef __unix__
#include <sys/select.h>
#include <unistd.h>
#endif
#ifndef BLACK
#define BLACK 0
#endif
#ifndef BLUE
#define BLUE 1
#endif
#ifndef GREEN
#define GREEN 2
#endif
#ifndef CYAN
#define CYAN 3
#endif
#ifndef RED
#define RED 4
#endif
#ifndef MAGENTA
#define MAGENTA 5
#endif
#ifndef BROWN
#define BROWN 6
#endif
#ifndef LIGHTGRAY
#define LIGHTGRAY 7
#endif
#ifndef DARKGRAY
#define DARKGRAY 8
#endif
#ifndef LIGHTBLUE
#define LIGHTBLUE 9
#endif
#ifndef LIGHTGREEN
#define LIGHTGREEN 10
#endif
#ifndef LIGHTCYAN
#define LIGHTCYAN 11
#endif
#ifndef LIGHTRED
#define LIGHTRED 12
#endif
#ifndef LIGHTMAGENTA
#define LIGHTMAGENTA 13
#endif
#ifndef YELLOW
#define YELLOW 14
#endif
#ifndef WHITE
#define WHITE 15
#endif
#ifndef BLINK
#define BLINK 128
#endif
static __inline__ void nrg_clrscr(void) {
  fputs("\\x1b[2J\\x1b[H", stdout);
  fflush(stdout);
}
static __inline__ void nrg_clreol(void) {
  fputs("\\x1b[K", stdout);
  fflush(stdout);
}
static __inline__ void nrg_gotoxy(int x, int y) {
  if (x < 1) x = 1;
  if (y < 1) y = 1;
  printf("\\x1b[%d;%dH", y, x);
  fflush(stdout);
}
static __inline__ int nrg_wherex(void) { return 1; }
static __inline__ int nrg_wherey(void) { return 1; }
static __inline__ void nrg_textcolor(int color) {
  static const int fg_map[16] = {30,34,32,36,31,35,33,37,90,94,92,96,91,95,93,97};
  int c = color & 15;
  printf("\\x1b[%dm", fg_map[c]);
  fflush(stdout);
}
static __inline__ void nrg_textbackground(int color) {
  static const int bg_map[16] = {40,44,42,46,41,45,43,47,100,104,102,106,101,105,103,107};
  int c = color & 15;
  printf("\\x1b[%dm", bg_map[c]);
  fflush(stdout);
}
static __inline__ void nrg_normvideo(void) {
  fputs("\\x1b[0m", stdout);
  fflush(stdout);
}
static __inline__ void nrg_noop(void) {}
static __inline__ int nrg_getch(void) {
  int c = getchar();
  return (c == EOF) ? 0 : c;
}
static __inline__ int nrg_getche(void) {
  int c = getchar();
  if (c == EOF) return 0;
  putchar(c);
  fflush(stdout);
  return c;
}
static __inline__ int nrg_putch(int c) {
  putchar(c);
  fflush(stdout);
  return c;
}
static __inline__ int nrg_cputs(const char *s) {
  int r = fputs(s ? s : "", stdout);
  fflush(stdout);
  return r;
}
static __inline__ int nrg_cprintf(const char *fmt, ...) {
  int r;
  va_list args;
  va_start(args, fmt);
  r = vprintf(fmt, args);
  va_end(args);
  fflush(stdout);
  return r;
}
static __inline__ int nrg_kbhit(void) {
#ifdef __unix__
  struct timeval tv;
  fd_set fds;
  tv.tv_sec = 0;
  tv.tv_usec = 0;
  FD_ZERO(&fds);
  FD_SET(0, &fds);
  return select(1, &fds, NULL, NULL, &tv) > 0 ? 1 : 0;
#else
  return 0;
#endif
}
#ifndef clrscr
#define clrscr nrg_clrscr
#define clreol nrg_clreol
#define gotoxy nrg_gotoxy
#define wherex nrg_wherex
#define wherey nrg_wherey
#define textcolor nrg_textcolor
#define textbackground nrg_textbackground
#define highvideo nrg_noop
#define lowvideo nrg_noop
#define normvideo nrg_normvideo
#define getch nrg_getch
#define _getch nrg_getch
#define getche nrg_getche
#define _getche nrg_getche
#define putch nrg_putch
#define _putch nrg_putch
#define cputs nrg_cputs
#define _cputs nrg_cputs
#define cprintf nrg_cprintf
#define _cprintf nrg_cprintf
#define kbhit nrg_kbhit
#define _kbhit nrg_kbhit
#endif
#endif`;

/**
 * Replaces #include <conio.h> with a portable cross-platform implementation
 * while preserving original source line numbers via #line directives.
 */
function preprocessCppCompat(sourceCode, language, filename) {
  if (typeof sourceCode !== 'string') return '';
  const lang = (language || '').toLowerCase().trim();
  if (lang !== 'c' && lang !== 'cpp') return sourceCode;

  const targetFile = filename || (lang === 'cpp' ? 'main.cpp' : 'main.c');
  CONIO_INCLUDE_REGEX.lastIndex = 0;
  if (!CONIO_INCLUDE_REGEX.test(sourceCode)) {
    return sourceCode;
  }

  let injected = false;
  return sourceCode.replace(CONIO_INCLUDE_REGEX, (match, _indent, offset) => {
    const lineNum = sourceCode.slice(0, offset).split('\n').length;
    if (injected) {
      return `/* duplicate conio.h include skipped */\n#line ${lineNum + 1} "${targetFile}"`;
    }
    injected = true;
    return `${CONIO_COMPAT_SHIM}\n#line ${lineNum + 1} "${targetFile}"`;
  });
}

/**
 * Injects unbuffered stdio constructors for interactive C/C++ execution without shifting user line numbers.
 */
function injectInteractiveUnbuffer(sourceCode, isCpp, filename) {
  const lang = isCpp ? 'cpp' : 'c';
  const targetFile = filename || (isCpp ? 'main.cpp' : 'main.c');
  const compatCode = preprocessCppCompat(sourceCode, lang, targetFile);
  if (compatCode.includes('__nrg_unbuffer') || compatCode.includes('__NRG_Init')) {
    return compatCode;
  }
  const hook = isCpp
    ? `#include <iostream>\n#include <cstdio>\nstruct __NRG_Init { __NRG_Init() { std::setvbuf(stdout, NULL, _IONBF, 0); std::setvbuf(stderr, NULL, _IONBF, 0); std::ios_base::sync_with_stdio(false); } } __nrg_init;\n#line 1 "${targetFile}"\n`
    : `#include <stdio.h>\n__attribute__((constructor)) static void __nrg_unbuffer() { setvbuf(stdout, NULL, _IONBF, 0); setvbuf(stderr, NULL, _IONBF, 0); }\n#line 1 "${targetFile}"\n`;
  return hook + compatCode;
}

/**
 * Builds fast compilation arguments (-O0 + -lm, plus -std=c++17 for C++).
 */
function buildCompileArgs(isCpp, srcPath, exePath, optimizeLevel = '-O0') {
  const args = [optimizeLevel];
  if (isCpp) args.push('-std=c++17');
  args.push(srcPath, '-o', exePath, '-lm');
  return args;
}

module.exports = {
  COMPILE_TIMEOUT_MS,
  MAX_EXECUTION_TIMEOUT_MS,
  INACTIVITY_TIMEOUT_MS,
  CONIO_COMPAT_SHIM,
  preprocessCppCompat,
  injectInteractiveUnbuffer,
  buildCompileArgs
};
