/*
 * group_report.js  2026/11/17
 * 作業報告書の一括出力（点検グループ単位で 1ファイル・複数ページ）
 *
 *  - InspReport.build(records, opt) … kintone のレコード配列から印刷用HTMLを作る（1台 = 1ページ、表紙つき）
 *  - InspReport.open(groupName, opt) … グループのレコードを取得して新しいウィンドウで開き、印刷ダイアログを出す
 *      → 送信先「PDFに保存」で 1つのPDF になる（ファイル名は「作業報告書-日付 点検種類 現場名」）
 *
 * 必須：inspection-core.js の後に読み込む。ボタンは group_list.js が表示する
 */
(function (global) {
  'use strict';
  const R = {};

  // ★ 自社情報（ロゴ画像を使う場合は logo に data:image/png;base64,... を入れる）
  R.COMPANY = {
    name: 'フジテック株式会社',
    // ロゴ（ロゴ.svg を埋め込み済み。差し替える時はこの文字列を置き換える）
    logo: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJf44Os44Kk44Ok44O8XzEiIGRhdGEtbmFtZT0i44Os44Kk44Ok44O8XzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMTY2Ljc1IDI1LjUxIj48Zz48cmVjdCB4PSIxMi44MSIgeT0iMS42NSIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMi4zMyAxMC4xNCkgcm90YXRlKC00NC45OCkiLz48cmVjdCB4PSIxMy44OSIgeT0iMi43MiIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMS45IDExLjIzKSByb3RhdGUoLTQ1LjAyKSIvPjxyZWN0IHg9IjE0Ljk2IiB5PSIzLjgiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEuNDUgMTIuMykgcm90YXRlKC00NSkiLz48cmVjdCB4PSIxNi4wNCIgeT0iNC44NyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMSAxMy4zNykgcm90YXRlKC00NSkiLz48cmVjdCB4PSIxNy4xMSIgeT0iNS45NSIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLjU2IDE0LjQ2KSByb3RhdGUoLTQ1LjAyKSIvPjxyZWN0IHg9IjE4LjE5IiB5PSI3LjAyIiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSguMTEgMTUuNTIpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTkuMjYiIHk9IjguMSIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLS4zNCAxNi41OSkgcm90YXRlKC00NC45OCkiLz48cmVjdCB4PSIyMC4zNCIgeT0iOS4xNyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLS43OCAxNy42Nykgcm90YXRlKC00NSkiLz48cmVjdCB4PSIyMS40MSIgeT0iMTAuMjUiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xLjIyIDE4Ljc1KSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjIyLjQ5IiB5PSIxMS4zMiIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEuNjcgMTkuODIpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMjMuNTYiIHk9IjEyLjQiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yLjEyIDIwLjg5KSByb3RhdGUoLTQ0Ljk4KSIvPjxyZWN0IHg9IjExLjc0IiB5PSIyLjcyIiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxLjI2IDkuNzEpIHJvdGF0ZSgtNDUuMDIpIi8+PHJlY3QgeD0iMTAuNjYiIHk9IjMuOCIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLjE5IDkuMjYpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iOS41OSIgeT0iNC44NyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLS44OSA4LjgxKSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjguNTEiIHk9IjUuOTUiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xLjk2IDguMzcpIHJvdGF0ZSgtNDUuMDIpIi8+PHJlY3QgeD0iNy40NCIgeT0iNy4wMiIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTMuMDQgNy45Mikgcm90YXRlKC00NC45OCkiLz48cmVjdCB4PSI2LjM2IiB5PSI4LjEiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC00LjExIDcuNDgpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iNS4yOSIgeT0iOS4xNyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuMTkgNy4wNCkgcm90YXRlKC00NS4wMikiLz48cmVjdCB4PSI0LjIxIiB5PSIxMC4yNSIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTYuMjYgNi41OSkgcm90YXRlKC00NSkiLz48cmVjdCB4PSIzLjE0IiB5PSIxMS4zMiIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTcuMzMgNi4xNCkgcm90YXRlKC00NC45OCkiLz48cmVjdCB4PSIyLjA2IiB5PSIxMi40IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOC40MSA1LjcpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTIuODEiIHk9IjMuOCIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLjgyIDEwLjc3KSByb3RhdGUoLTQ0Ljk4KSIvPjxyZWN0IHg9IjExLjc0IiB5PSI0Ljg3IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtLjI2IDEwLjM0KSByb3RhdGUoLTQ1LjAyKSIvPjxyZWN0IHg9IjEwLjY2IiB5PSI1Ljk1IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMS4zMyA5Ljg5KSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjkuNTkiIHk9IjcuMDIiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yLjQxIDkuNDQpIHJvdGF0ZSgtNDQuOTgpIi8+PHJlY3QgeD0iOC41MSIgeT0iOC4xIiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMy40OCA5KSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjcuNDQiIHk9IjkuMTciIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC00LjU2IDguNTYpIHJvdGF0ZSgtNDUuMDIpIi8+PHJlY3QgeD0iNi4zNiIgeT0iMTAuMjUiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01LjYzIDguMTEpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iNS4yOSIgeT0iMTEuMzIiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02LjcxIDcuNjYpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iNC4yMSIgeT0iMTIuNCIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTcuNzggNy4yMSkgcm90YXRlKC00NC45OCkiLz48cmVjdCB4PSIzLjE0IiB5PSIxMy40NyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTguODUgNi43Nykgcm90YXRlKC00NC45OCkiLz48cmVjdCB4PSIxMy44OSIgeT0iNC44NyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLjM3IDExLjg2KSByb3RhdGUoLTQ1LjAyKSIvPjxyZWN0IHg9IjEyLjgxIiB5PSI1Ljk1IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtLjcgMTEuNDEpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTEuNzQiIHk9IjcuMDIiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xLjc4IDEwLjk2KSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjEwLjY2IiB5PSI4LjEiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yLjg1IDEwLjUxKSByb3RhdGUoLTQ0Ljk4KSIvPjxyZWN0IHg9IjkuNTkiIHk9IjkuMTciIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zLjkzIDEwLjA4KSByb3RhdGUoLTQ1LjAyKSIvPjxyZWN0IHg9IjguNTEiIHk9IjEwLjI1IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNSA5LjYzKSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjcuNDQiIHk9IjExLjMyIiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNi4wOCA5LjE4KSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjYuMzYiIHk9IjEyLjQiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03LjE1IDguNzQpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iNS4yOSIgeT0iMTMuNDciIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC04LjIzIDguMjkpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iNC4yMSIgeT0iMTQuNTUiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC05LjMgNy44NSkgcm90YXRlKC00NSkiLz48cmVjdCB4PSIxNC45NiIgeT0iNS45NSIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLS4wNyAxMi45NCkgcm90YXRlKC00NS4wMikiLz48cmVjdCB4PSIxMy44OSIgeT0iNy4wMiIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEuMTUgMTIuNDgpIHJvdGF0ZSgtNDQuOTgpIi8+PHJlY3QgeD0iMTEuNzQiIHk9IjkuMTciIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zLjMgMTEuNikgcm90YXRlKC00NS4wNCkiLz48cmVjdCB4PSIxMC42NiIgeT0iMTAuMjUiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC00LjM3IDExLjE0KSByb3RhdGUoLTQ0Ljk4KSIvPjxyZWN0IHg9IjkuNTkiIHk9IjExLjMyIiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNS40NSAxMC43KSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjE2LjA0IiB5PSI3LjAyIiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtLjUyIDE0KSByb3RhdGUoLTQ0Ljk4KSIvPjxyZWN0IHg9IjE0Ljk2IiB5PSI4LjEiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xLjYgMTMuNTUpIHJvdGF0ZSgtNDQuOTgpIi8+PHJlY3QgeD0iMTIuODEiIHk9IjEwLjI1IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMy43NCAxMi42Nikgcm90YXRlKC00NC45OCkiLz48cmVjdCB4PSIxMS43NCIgeT0iMTEuMzIiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC00LjgyIDEyLjI0KSByb3RhdGUoLTQ1LjA0KSIvPjxyZWN0IHg9IjEwLjY2IiB5PSIxMi40IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNS44OSAxMS43OCkgcm90YXRlKC00NSkiLz48cmVjdCB4PSI4LjUxIiB5PSIxNC41NSIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTguMDQgMTAuODkpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iNy40NCIgeT0iMTUuNjIiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC05LjEyIDEwLjQ0KSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjYuMzYiIHk9IjE2LjciIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMC4yIDEwKSByb3RhdGUoLTQ1LjAyKSIvPjxyZWN0IHg9IjE3LjExIiB5PSI4LjEiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0uOTcgMTUuMDcpIHJvdGF0ZSgtNDQuOTgpIi8+PHJlY3QgeD0iMTYuMDQiIHk9IjkuMTciIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yLjA0IDE0LjY0KSByb3RhdGUoLTQ1LjAyKSIvPjxyZWN0IHg9IjEzLjg5IiB5PSIxMS4zMiIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQuMTkgMTMuNzUpIHJvdGF0ZSgtNDUuMDIpIi8+PHJlY3QgeD0iMTIuODEiIHk9IjEyLjQiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01LjI2IDEzLjI5KSByb3RhdGUoLTQ0Ljk4KSIvPjxyZWN0IHg9IjExLjc0IiB5PSIxMy40NyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTYuMzQgMTIuODYpIHJvdGF0ZSgtNDUuMDIpIi8+PHJlY3QgeD0iOS41OSIgeT0iMTUuNjIiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC04LjQ5IDExLjk2KSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjguNTEiIHk9IjE2LjciIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC05LjU3IDExLjUyKSByb3RhdGUoLTQ1LjAyKSIvPjxyZWN0IHg9IjcuNDQiIHk9IjE3Ljc3IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTAuNjQgMTEuMDcpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTguMTkiIHk9IjkuMTciIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xLjQxIDE2LjE2KSByb3RhdGUoLTQ1LjAyKSIvPjxyZWN0IHg9IjE3LjExIiB5PSIxMC4yNSIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTIuNDkgMTUuNykgcm90YXRlKC00NC45OCkiLz48cmVjdCB4PSIxNC45NiIgeT0iMTIuNCIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQuNjMgMTQuODIpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTMuODkiIHk9IjEzLjQ3IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNS43MSAxNC4zNykgcm90YXRlKC00NSkiLz48cmVjdCB4PSIxMi44MSIgeT0iMTQuNTUiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02Ljc4IDEzLjkyKSByb3RhdGUoLTQ0Ljk4KSIvPjxyZWN0IHg9IjEwLjY2IiB5PSIxNi43IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOC45MyAxMy4wNCkgcm90YXRlKC00NSkiLz48cmVjdCB4PSI5LjU5IiB5PSIxNy43NyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEwLjAxIDEyLjU5KSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjguNTEiIHk9IjE4Ljg1IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTEuMDggMTIuMTUpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTkuMjYiIHk9IjEwLjI1IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMS44NSAxNy4yMykgcm90YXRlKC00NSkiLz48cmVjdCB4PSIxOC4xOSIgeT0iMTEuMzIiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yLjkzIDE2Ljc4KSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjExLjc0IiB5PSIxNy43NyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkuMzggMTQuMTIpIHJvdGF0ZSgtNDUuMDIpIi8+PHJlY3QgeD0iMTAuNjYiIHk9IjE4Ljg1IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTAuNDUgMTMuNjYpIHJvdGF0ZSgtNDQuOTgpIi8+PHJlY3QgeD0iOS41OSIgeT0iMTkuOTIiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMS41MyAxMy4yMikgcm90YXRlKC00NSkiLz48cmVjdCB4PSIyMC4zNCIgeT0iMTEuMzIiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0yLjMgMTguMykgcm90YXRlKC00NSkiLz48cmVjdCB4PSIxOS4yNiIgeT0iMTIuNCIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTMuMzcgMTcuODYpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTcuMTEiIHk9IjE0LjU1IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNS41MyAxNi45Nikgcm90YXRlKC00NC45OCkiLz48cmVjdCB4PSIxNi4wNCIgeT0iMTUuNjIiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC02LjYgMTYuNTIpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTQuOTYiIHk9IjE2LjciIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03LjY3IDE2LjA5KSByb3RhdGUoLTQ1LjAyKSIvPjxyZWN0IHg9IjEzLjg5IiB5PSIxNy43NyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTguNzUgMTUuNjMpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTIuODEiIHk9IjE4Ljg1IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOS44MiAxNS4xOCkgcm90YXRlKC00NC45OCkiLz48cmVjdCB4PSIxMS43NCIgeT0iMTkuOTIiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMC45IDE0Ljc1KSByb3RhdGUoLTQ1LjAyKSIvPjxyZWN0IHg9IjEwLjY2IiB5PSIyMSIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExLjk3IDE0LjI5KSByb3RhdGUoLTQ0Ljk4KSIvPjxyZWN0IHg9IjIxLjQxIiB5PSIxMi40IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMi43NSAxOS4zNykgcm90YXRlKC00NC45OCkiLz48cmVjdCB4PSIyMC4zNCIgeT0iMTMuNDciIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0zLjgyIDE4LjkzKSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjE4LjE5IiB5PSIxNS42MiIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTUuOTcgMTguMDMpIHJvdGF0ZSgtNDQuOTgpIi8+PHJlY3QgeD0iMTcuMTEiIHk9IjE2LjciIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03LjA0IDE3LjYpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTYuMDQiIHk9IjE3Ljc3IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtOC4xMiAxNy4xNSkgcm90YXRlKC00NSkiLz48cmVjdCB4PSIxNC45NiIgeT0iMTguODUiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC05LjE5IDE2LjcxKSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjEzLjg5IiB5PSIxOS45MiIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEwLjI3IDE2LjI2KSByb3RhdGUoLTQ1KSIvPjxyZWN0IHg9IjEyLjgxIiB5PSIyMSIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTExLjM0IDE1LjgxKSByb3RhdGUoLTQ0Ljk4KSIvPjxyZWN0IHg9IjExLjc0IiB5PSIyMi4wNyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEyLjQyIDE1LjM5KSByb3RhdGUoLTQ1LjA0KSIvPjxyZWN0IHg9IjIyLjQ5IiB5PSIxMy40NyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTMuMTkgMjAuNDQpIHJvdGF0ZSgtNDQuOTgpIi8+PHJlY3QgeD0iMjEuNDEiIHk9IjE0LjU1IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNC4yNyAyMC4wMSkgcm90YXRlKC00NSkiLz48cmVjdCB4PSIxOS4yNiIgeT0iMTYuNyIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTYuNDIgMTkuMTIpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTguMTkiIHk9IjE3Ljc3IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNy40OSAxOC42Nykgcm90YXRlKC00NSkiLz48cmVjdCB4PSIxNy4xMSIgeT0iMTguODUiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC04LjU2IDE4LjIyKSByb3RhdGUoLTQ0Ljk4KSIvPjxyZWN0IHg9IjE2LjA0IiB5PSIxOS45MiIgd2lkdGg9IjEuMjEiIGhlaWdodD0iMS4yMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTkuNjQgMTcuNzgpIHJvdGF0ZSgtNDUpIi8+PHJlY3QgeD0iMTQuOTYiIHk9IjIxIiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTAuNzEgMTcuMzMpIHJvdGF0ZSgtNDQuOTgpIi8+PHJlY3QgeD0iMTMuODkiIHk9IjIyLjA3IiB3aWR0aD0iMS4yMSIgaGVpZ2h0PSIxLjIxIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTEuNzkgMTYuOSkgcm90YXRlKC00NS4wMikiLz48cmVjdCB4PSIxMi44MSIgeT0iMjMuMTUiIHdpZHRoPSIxLjIxIiBoZWlnaHQ9IjEuMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xMi44NiAxNi40NCkgcm90YXRlKC00NC45OCkiLz48L2c+PGc+PHBhdGggZD0iTTMzLjE2LDUuOXYyLjcyaDExLjg0Yy0xLjY5LDkuNjUtMTEuMDEsOS4xMi0xMS4wMSw5LjEydjIuNDljMTMuOTctLjEyLDEyLjU1LTE0LjMzLDEyLjU1LTE0LjMzaC0xMy4zOFoiLz48cG9seWdvbiBwb2ludHM9IjU0LjcxIDcuNzkgNDcuNzIgNS45IDQ3LjcyIDguNzQgNTQuNzEgMTAuNTIgNTQuNzEgNy43OSIvPjxwb2x5Z29uIHBvaW50cz0iNDcuOCAxMy4xNiA1NC43OCAxNC45NCA1NC43OCAxMi4yMSA0Ny44IDEwLjMyIDQ3LjggMTMuMTYiLz48cGF0aCBkPSJNNjAuMzEsOS4xM2MtLjQ3LDguMzctNy4xLDguNDQtNy4xLDguNDRsLTUuNDkuMTZ2Mi42MWw2LjI4LS4wOGM4LjY4LTEuNSw3LjQyLTExLjA1LDcuNDItMTEuMDVsLTEuMS0uMDhaIi8+PHBhdGggZD0iTTYyLjUyLDEzLjU2aDYuNzljLS42Myw0Ljc0LTUuNiw0LjI2LTUuNiw0LjI2djIuNmM3LjgxLDAsNy4yNi02Ljk1LDcuMjYtNi45NWg1LjI5di0yLjc2aC0xMy43M3YyLjg0WiIvPjxwb2x5Z29uIHBvaW50cz0iODAuOTkgMTIuNjkgNzkuMjUgOC44MiA3Ny41MiA4LjgyIDc5LjE3IDEyLjY5IDgwLjk5IDEyLjY5Ii8+PHBvbHlnb24gcG9pbnRzPSI4NC4zIDEyLjc3IDgyLjU3IDguOSA4MC44MyA4LjkgODIuNDkgMTIuNzcgODQuMyAxMi43NyIvPjxwYXRoIGQ9Ik04OC4xNyw4LjVjLS43MSw4LjY4LTYuNTUsOC45Mi02LjU1LDguOTJsLTMuNzkuMDh2Mi43NmMzLjU1LDAsNi0uODcsNi0uODcsNi4zMS0yLjc2LDUuMjktMTAuODksNS4yOS0xMC44OWgtLjk1WiIvPjxwYXRoIGQ9Ik0xMDMuMDksNS45aC03Ljk3Yy0uODcsNC42Ni00LjY2LDUuMDUtNC42Niw1LjA1djIuMjljMy4zMi4zLDUuNzYtNC44OSw1Ljc2LTQuODloNi41NWMtMS42NiwxMC4xLTEwLjk3LDkuMTYtMTAuOTcsOS4xNnYyLjg0YzEyLjExLjE2LDEzLjEtMTIuMzksMTMuMS0xMy40MnMtMS44Mi0xLjAzLTEuODItMS4wM1oiLz48cGF0aCBkPSJNMTMzLjI0LDcuNDhoLTIuNGMtLjAyLS40OC0uMDQtLjk3LS4wNS0xLjVoLTEuMjZzLS4wMi41OCwwLDEuNWgtOC40NGwuMDgsMi4yOWg4LjQ2Yy4zLDQuMTEsMS4zOSwxMC4xMSw1LjI4LDEwLjI2di0yLjYxcy0yLjk4LS4zNi0zLjg2LTcuNjZoMi45MnMxLjAzLS4wOCwxLjExLTEuMzR2LTIuNmgtMS44MnYxLjY2WiIvPjxwYXRoIGQ9Ik0xNTcuNTYsMTYuNDh2LTIuMjlzLTEuOS0uNzEtMi4zNy0xLjU4YzAsMCwxLjE4LTEuMzQsMS4yNi01LjIxaC0yLjI5di0xLjY2aC0xLjI2djEuNjZoLTIuMjF2Mi4zN2wzLjg3LS4wOHMtLjk1LDMtMy45NSw0LjgxdjIuNzZzMS42NS0uODUsMi42OC0xLjk2djQuNzJoMS4yNnYtNS4xNmMuODEuNTUsMi4xOSwxLjQ0LDMsMS42MVoiLz48cGF0aCBkPSJNMTM4LjMsMTEuNjZoOS4yOHYtLjg2YzEuMjIuNDksMi4xNy43LDIuMTcuN3YtMi4yMWMtMy43OS0uNTUtNi45NS0zLjcxLTYuOTUtMy43MS0xLjg5LDIuNzYtNi44NywzLjcxLTYuODcsMy43MXYyLjIxYy44Ny0uMDcsMS42Ni0uMjYsMi4zNy0uNTR2LjdaTTE0Mi43OSw3LjI0Yy41OC45NCwxLjQzLDEuNjksMi4zMywyLjI5aC00LjRjMS4zNy0xLjEyLDIuMDctMi4yOSwyLjA3LTIuMjlaIi8+PHBvbHlnb24gcG9pbnRzPSIxNjEuMTEgMTcuOSAxNjEuMTEgOS42MSAxNjQuMTEgOS42MSAxNjQuMTEgNy40OCAxNjEuMTEgNy40OCAxNjEuMTEgNS42NiAxNTkuODQgNS42NiAxNTkuODQgNy40OCAxNTcuMTYgNy40OCAxNTcuMTYgOS42MSAxNTkuODQgOS42MSAxNTkuODQgMTcuOSAxNTYuMDUgMTcuOSAxNTYuMDUgMjAuMDMgMTY0LjUgMjAuMDMgMTY0LjUgMTcuOSAxNjEuMTEgMTcuOSIvPjxwYXRoIGQ9Ik0xMzUuODUsMTUuNjFoMi42NWwtMS41NSwxLjgxcy0xLjQyLDEuOSwwLDIuNDVjMCwwLC43MS4zMiwxLjE4LjMyaDkuODdzMS4xLS4wOCwxLjI2LS44N2MuMTYtLjc5LTEuMzQtMi42OC0xLjY2LTNoLTIuNjhsLjcxLDEuMzRoLTYuNzlsMS42Mi0yLjA1aDkuMzV2LTIuMzdoLTEzLjk3djIuMzdaIi8+PHBhdGggZD0iTTEwOS4yNSw5Ljg1aDEuMzR2LTIuMzdoLTEuMzR2LTEuODloLTEuMjZ2MS44OWgtMi4xM3YyLjM3aDEuOTVjLS4xNi40Ny0xLjExLDMuMTMtMi4yNiw0LjV2Mi45MnMxLjgyLTEuNTgsMi4zNy0yLjY4Yy4wMy0uMDUuMDUtLjEuMDgtLjE1djUuODNoMS4yNnYtNi4wMWMuMzIuMjksMS4wNi45MiwxLjQyLDEuMDR2LTIuODRzLTEuMTEtMS4xMi0xLjQyLTIuMzl2LS4yMloiLz48cGF0aCBkPSJNMTE2LjA0LDkuNjloMy4zOXYtMi4yOWgtMy4zOXYtMS44MmgtMS4yNnYxLjgyaC0yLjIxdi0xLjVoLTEuMjZ2Mi45MnMuMTYuNzEuNzEuODdoMi43NnYxLjc0aC0zLjYzdjIuMzdoMy4yNHMtMS4wMywyLjQ1LTMuNjMsMy41NXYyLjM3czIuNTEtLjg2LDQuMDMtMi44OXYzLjQ0aDEuMjZ2LTMuMWMuOTQuOTYsMi40NSwyLjM0LDMuNDcsMi41NXYtMi42cy0yLjA4LTEuMDQtMy4xOS0zLjMyaDMuNDJ2LTIuMzdoLTMuNzF2LTEuNzRaIi8+PHBvbHlnb24gcG9pbnRzPSIxMjUuNzUgMTMuNTYgMTI5LjA2IDEzLjU2IDEyOS4wNiAxMS40MiAxMjEuNDggMTEuNDIgMTIxLjQ4IDEzLjU2IDEyNC40OCAxMy41NiAxMjQuNDggMTguMTMgMTIxLjA5IDE4LjEzIDEyMS4wOSAyMC4yNiAxMjkuODUgMjAuMjYgMTI5Ljg1IDE4LjEzIDEyNS43NSAxOC4xMyAxMjUuNzUgMTMuNTYiLz48cmVjdCB4PSI1OC4yNiIgeT0iNi4wNiIgd2lkdGg9IjEuNDIiIGhlaWdodD0iMi4xMyIvPjxyZWN0IHg9IjYwLjI5IiB5PSI2LjA2IiB3aWR0aD0iMS40MiIgaGVpZ2h0PSIyLjEzIi8+PHJlY3QgeD0iNjMuNjIiIHk9IjUuOTgiIHdpZHRoPSIxMS42OCIgaGVpZ2h0PSIyLjkyIi8+PC9nPjwvc3ZnPg==',
    lines: ['浜松市中央区材木町918-2', 'TEL （053）423-0550', 'FAX （053）423-0551']
  };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const v = (rec, c) => (rec[c] && rec[c].value != null ? rec[c].value : '');
  const has = x => x !== '' && x != null;
  const WD = ['日','月','火','水','木','金','土'];
  const wdate = d => { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); if (!m) return ''; const t = new Date(+m[1], m[2] - 1, +m[3]); return `${m[1]}/${m[2]}/${m[3]}(${WD[t.getDay()]})`; };
  const users = rec => {
    const u = v(rec, 'ユーザー選択');
    const list = Array.isArray(u) && u.length ? u : (Array.isArray(v(rec, '作業者')) ? v(rec, '作業者') : []);
    return list.map(x => x.name).join('・');
  };
  // 報告書に載せる お客様名・住所・電話番号（ルックアップ／最終訪問先などの計算フィールドは使わない）
  const site = rec => v(rec, '現場名');
  const addr = rec => v(rec, '報告書へ記載する住所');
  const tel  = rec => v(rec, '報告書へ記載する電話番号');
  const naSet = rec => { const C = global.InspCore; return new Set((v(rec, '対象外項目') || []).map(o => (C ? C.NA_MAP[o] : o))); };

  // 測定値（単位つき）。対象外は「—」
  function mv(rec, code, unit, na) {
    if (na.has(code)) return '—';
    const x = v(rec, code);
    return has(x) ? esc(x) + unit : '';
  }
  function insul(rec) { const x = v(rec, '絶縁'); if (!has(x)) return ''; return +x >= 100 ? '∞' : esc(x) + 'MΩ'; }

  // ───────── CSS（A4縦・mm指定） ─────────
  R.CSS = `
@page{size:A4 portrait;margin:0}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#e9ecef}
body{font-family:"Yu Gothic","YuGothic","Meiryo","Noto Sans CJK JP","Noto Sans JP",sans-serif;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.bar{position:sticky;top:0;z-index:5;background:#1a73e8;color:#fff;padding:10px 16px;display:flex;gap:12px;align-items:center;font-size:14px;flex-wrap:wrap}
.bar button{border:0;background:#fff;color:#1a73e8;font-weight:700;font-size:15px;padding:8px 18px;border-radius:20px;cursor:pointer}
.page{width:210mm;height:297mm;margin:8mm auto;background:#fff;padding:10mm 12mm 9mm;display:flex;flex-direction:column;gap:1.8mm;box-shadow:0 2px 10px rgba(0,0,0,.2);overflow:hidden;position:relative;page-break-after:always;break-after:page}
.page:last-child{page-break-after:auto;break-after:auto}
@media print{html,body{background:#fff}.bar{display:none}.page{margin:0;box-shadow:none}}
.hdr{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;margin-bottom:1mm}
.ttl{font-size:21pt;letter-spacing:.55em;padding-left:.55em;font-weight:500;text-align:center}
.co{justify-self:end;text-align:right;font-size:7.5pt;line-height:1.35}
.co .nm{font-size:12pt;font-weight:800;letter-spacing:.04em;margin-bottom:.6mm}
.co img{height:7mm;display:block;margin:0 0 1.2mm auto}
table{border-collapse:collapse;width:100%;table-layout:fixed}
td,th{border:.25mm solid #222;padding:.7mm 1.6mm;font-size:8.6pt;height:5.9mm;vertical-align:middle;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
th{background:#f1f1f1;font-weight:500;text-align:center;letter-spacing:.08em}
td.c{text-align:center}
td.wrap{white-space:normal;font-size:7.4pt;line-height:1.15;padding:.4mm 1.2mm}
td.v{font-size:9.4pt}
.cap{display:flex;justify-content:space-between;align-items:flex-end;font-size:8.6pt;margin-top:1mm}
.cap small{font-size:7.6pt}
.vis td.j{text-align:center;font-weight:700}
.vis td.j.y{background:#fff1e0}
.ms td{height:5.4mm}
.ms td.l{font-size:7.8pt}
.ms td.r{text-align:center;font-size:9.4pt}
.iu td{height:5.2mm;font-size:8.2pt}
.memo{flex:1000 0 auto;display:flex;flex-direction:column;border:.25mm solid #222;min-height:16mm}
.grow{flex:1 0 0}
.photos{display:grid;grid-template-columns:repeat(3,1fr);gap:3mm}
.ph{height:50mm;border:.25mm solid #222;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff}
.ph img{max-width:100%;max-height:100%;object-fit:contain;display:block}
.memo .h{background:#f1f1f1;border-bottom:.25mm solid #222;text-align:center;font-size:8.6pt;padding:.9mm;letter-spacing:.2em}
.memo .b{padding:2mm 2.4mm;font-size:9.4pt;white-space:pre-wrap;line-height:1.55}
.foot{display:flex;justify-content:space-between;font-size:7.2pt;color:#555;padding-top:1mm}
/* 表紙 */
.cv .ttl{font-size:19pt;letter-spacing:.35em}
.cv .sub{font-size:9pt;color:#444;text-align:center;margin-top:-1mm}
.cv .list td{height:7.2mm;font-size:8.8pt}
.cv .ttl{white-space:nowrap}
.cv .list td.w{white-space:normal;font-size:8pt;line-height:1.25}
.badge{display:inline-block;border:.25mm solid #222;border-radius:1mm;padding:0 1.4mm;font-size:7.8pt;font-weight:700}
.badge.y{background:#fff1e0}
`;

  // ───────── 1台分のページ ─────────

  function headerHTML(title) {
    const c = R.COMPANY;
    return `<div class="hdr"><div></div><div class="ttl">${esc(title)}</div>
      <div class="co">${c.logo ? `<img src="${c.logo}" alt="">` : `<div class="nm">${esc(c.name)}</div>`}${c.lines.map(esc).join('<br>')}</div></div>`;
  }
  function custHTML(rec) {
    return `<table><colgroup><col style="width:22mm"><col><col style="width:22mm"><col style="width:42mm"></colgroup>
      <tr><th>お客様名</th><td class="v" colspan="3">${esc(site(rec))}</td></tr>
      <tr><th>住　所</th><td class="v">${esc(addr(rec))}</td><th>電話番号</th><td class="v">${esc(tel(rec))}</td></tr></table>`;
  }
  function infoHTML(rec) {
    const ryo = String(v(rec, '冷媒量') || '').trim(), ref = [v(rec, '冷媒種'), ryo ? esc(ryo) + (/^[\d.,]+$/.test(ryo) ? 'kg' : '') : ''];   // 数値だけのときに kg を付ける
    // 作業者・冷媒種・量の列（4列目）を広く取る
    return `<table><colgroup><col style="width:22mm"><col style="width:31mm"><col style="width:22mm"><col><col style="width:20mm"><col style="width:32mm"></colgroup>
      <tr><th>作業日</th><td class="v">${wdate(v(rec, '日付'))}</td><th>作業者</th><td class="v">${esc(users(rec))}</td><th>内容</th><td class="wrap">${esc(v(rec, '点検種類'))}</td></tr>
      <tr><th>管理情報</th><td class="v" colspan="5">${esc(v(rec, '系統'))}</td></tr>
      <tr><th>型　式</th><td class="v" colspan="3">${esc(v(rec, '型式'))}</td><th>製造番号</th><td class="v">${esc(v(rec, '製造番号'))}</td></tr>
      <tr><th>メーカー</th><td class="v">${esc(v(rec, 'メーカー'))}</td><th>冷媒種・量</th><td class="v">${esc(ref[0])}　${ref[1]}</td><th>納入年月</th><td class="v">${esc(v(rec, '納入年月'))}</td></tr></table>`;
  }
  function visualHTML(rec) {
    const C = global.InspCore;
    const items = C ? C.VISUAL : [];
    const no = ['①','②','③','④'];
    return `<div class="cap"><span>システム漏洩点検項目（目視点検）</span><small>${esc(v(rec, '圧縮機出力') ? '圧縮機出力：' + v(rec, '圧縮機出力') : '')}</small></div>
      <table class="vis"><colgroup><col><col style="width:22mm"><col style="width:78mm"></colgroup>
      <tr><th>点検項目</th><th>判定</th><th>備考</th></tr>
      ${items.map((x, i) => { const j = v(rec, x[0]) || '無'; return `<tr><td>${no[i]}　${esc(x[0])}</td><td class="j${j === '有' ? ' y' : ''}">${esc(j)}</td><td>${esc(v(rec, x[1]))}</td></tr>`; }).join('')}</table>`;
  }
  function measureHTML(rec) {
    const na = naSet(rec);
    const c1 = [['総合電圧', mv(rec, '総合電圧', 'V', na)], ['総合電流', mv(rec, '総合電流', 'A', na)], ['圧縮機（INV）電流', mv(rec, '圧縮機_INV', 'A', na)],
                ['圧縮機（STD1）電流', mv(rec, '圧縮機_STD1', 'A', na)], ['圧縮機（STD2）電流', mv(rec, '圧縮機_STD2', 'A', na)],
                ['FAN1 電流', mv(rec, 'FAN1', 'A', na)], ['FAN2 電流', mv(rec, 'FAN2', 'A', na)]];
    const c2 = [['高圧（凝縮）圧力', mv(rec, '高圧圧力', 'MPa', na)], ['高圧凝縮温度', mv(rec, '高圧飽和温度', '℃', na)],
                ['低圧（蒸発）圧力', mv(rec, '低圧圧力', 'MPa', na)], ['低圧蒸発温度', mv(rec, '低圧飽和温度', '℃', na)],
                ['吐出管温度', mv(rec, '吐出管温度', '℃', na)], ['吸入管温度', mv(rec, '吸入管温度', '℃', na)],
                ['膨張弁入口温度', mv(rec, '膨張弁入口温度', '℃', na)], ['膨張弁出口温度', mv(rec, '膨張弁出口温度', '℃', na)],
                ['室外機 吸込温度', mv(rec, '室外吸込温度', '℃', na)], ['室外機 吹出温度', mv(rec, '室外吹出温度', '℃', na)]];
    const c3 = [['過熱度', mv(rec, '過熱度', 'K', na)], ['過冷却度', mv(rec, '過冷却度', 'K', na)]];
    if (has(v(rec, '冷温水入口温度'))) c3.push(['冷温水入口温度', mv(rec, '冷温水入口温度', '℃', na)]);
    if (has(v(rec, '冷温水出口温度'))) c3.push(['冷温水出口温度', mv(rec, '冷温水出口温度', '℃', na)]);
    if (has(v(rec, 'Vベルト情報連結'))) c3.push(['Vベルト', esc(v(rec, 'Vベルト情報連結'))]);
    c3.push(['絶縁抵抗', insul(rec)]);
    const n = Math.max(c1.length, c2.length, c3.length);
    const cell = (col, i) => col[i] ? `<td class="l">${esc(col[i][0])}</td><td class="r">${col[i][1]}</td>` : '<td></td><td></td>';
    let rows = '';
    for (let i = 0; i < n; i++) rows += `<tr>${cell(c1, i)}${cell(c2, i)}${cell(c3, i)}</tr>`;
    return `<table class="ms"><colgroup><col style="width:33mm"><col style="width:22mm"><col style="width:33mm"><col style="width:22mm"><col><col style="width:24mm"></colgroup>
      <tr><th>実 測 項 目</th><th>実測値</th><th>実 測 項 目</th><th>実測値</th><th>実 測 項 目</th><th>実測値</th></tr>${rows}</table>`;
  }
  function indoorRows(rec) {
    const C = global.InspCore;
    return C ? C.fromRecord(rec).indoor : [];
  }
  function indoorHTML(rows, startNo, cont) {
    if (!rows.length) return '';
    const dt = r => (has(r.吸込) && has(r.吹出)) ? (parseFloat(r.吸込) - parseFloat(r.吹出)).toFixed(1) + '℃' : '';
    return `<div class="iublk"><div class="cap"><span>室内機データ${cont ? '（続き）' : ''}</span><small>温度差 ＝ 吸込温度 − 吹出温度</small></div>
      <table class="iu"><colgroup><col style="width:9mm"><col style="width:38mm"><col style="width:30mm"><col style="width:20mm"><col style="width:20mm"><col style="width:20mm"><col></colgroup>
      <thead><tr><th>No</th><th>型式</th><th>製造番号</th><th>吸込温度</th><th>吹出温度</th><th>温度差</th><th>備考</th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr><td class="c">${startNo + i}</td><td>${esc(r.型式)}</td><td>${esc(r.製造番号)}</td><td class="c">${has(r.吸込) ? esc(r.吸込) + '℃' : ''}</td><td class="c">${has(r.吹出) ? esc(r.吹出) + '℃' : ''}</td><td class="c">${dt(r)}</td><td>${esc(r.備考)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  // 写真（添付ファイル／_0／_1 の画像。3枠1行、4枚以上は行を増やす。最大9枚）
  const PHOTO_FIELDS = ['添付ファイル', '添付ファイル_0', '添付ファイル_1'];
  const isImg = f => /^image\//.test(f.contentType || '') || /\.(jpe?g|png|gif|webp)$/i.test(f.name || '');
  R.photoKeys = rec => PHOTO_FIELDS.flatMap(f => (v(rec, f) || []).filter(isImg).map(x => x.fileKey)).slice(0, 9);
  function photosHTML(rec, images) {
    const keys = R.photoKeys(rec).filter(k => images && images[k]);
    if (!keys.length) return '';   // 写真が1枚も無い機器は枠ごと出さない（特記事項がその分広がる）
    const cells = keys.map(k => `<div class="ph"><img src="${images[k]}" alt=""></div>`);
    while (cells.length % 3) cells.push('<div class="ph"></div>');
    return `<div class="photos">${cells.join('')}</div>`;
  }
  function memoHTML(rec) {
    return `<div class="memo"><div class="h">特記事項</div><div class="b">${esc(v(rec, '報告書用フィールド'))}</div></div>`;
  }

  // ───────── 表紙（機器一覧） ─────────
  function coverHTML(recs, group) {
    const C = global.InspCore, r0 = recs[0];
    const workers = [...new Set(recs.map(users).join('・').split('・').filter(Boolean))].join('・');
    const iuTotal = recs.reduce((a, r) => a + indoorRows(r).length, 0);
    const rows = recs.map((r, i) => {
      const nVis = C ? C.VISUAL.filter(x => v(r, x[0]) === '有').length : 0;
      const memo = String(v(r, '報告書用フィールド') || '').split('\n').filter(Boolean)[0] || '';
      return `<tr><td class="c">${i + 1}</td><td class="w">${esc(v(r, '系統'))}</td><td class="w">${esc(v(r, '型式'))}</td><td>${esc(v(r, '製造番号'))}</td><td class="c">${esc(v(r, '冷媒種'))}</td>
        <td class="c">${indoorRows(r).length || ''}</td><td class="c">${nVis ? `<span class="badge y">有 ${nVis}</span>` : '<span class="badge">異常なし</span>'}</td><td class="w">${esc(memo)}</td><td class="c pgref" data-ref="m${i}"></td></tr>`;
    }).join('');
    return `<section class="page cv">${headerHTML('点検結果一覧')}
      <div class="sub">${esc(group)}</div>
      <table><colgroup><col style="width:22mm"><col><col style="width:18mm"><col style="width:58mm"></colgroup>
        <tr><th>お客様名</th><td class="v" colspan="3">${esc(site(r0))}</td></tr>
        <tr><th>住　所</th><td class="v">${esc(addr(r0))}</td><th>電話番号</th><td class="v">${esc(tel(r0))}</td></tr>
        <tr><th>作業日</th><td class="v">${wdate(v(r0, '日付'))}</td><th>内容</th><td class="wrap">${esc(v(r0, '点検種類'))}</td></tr>
        <tr><th>作業者</th><td class="v">${esc(workers)}</td><th>台数</th><td class="v" style="white-space:normal">室外機 ${recs.length}台${iuTotal ? `／室内機 ${iuTotal}台` : ''}</td></tr></table>
      <div class="cap"><span>点検機器一覧</span><small>詳細は各ページの作業報告書をご覧ください</small></div>
      <table class="list"><colgroup><col style="width:10mm"><col style="width:32mm"><col style="width:30mm"><col style="width:22mm"><col style="width:14mm"><col style="width:12mm"><col style="width:17mm"><col><col style="width:9mm"></colgroup>
        <thead><tr><th>No</th><th>管理情報</th><th>型式</th><th>製造番号</th><th>冷媒</th><th>室内</th><th>目視点検</th><th>特記事項</th><th>頁</th></tr></thead><tbody>${rows}</tbody></table>
      <div style="flex:1"></div><div class="foot"><span>${esc(group)}</span><span class="pg"></span></div></section>`;
  }

  // ───────── 出力ウィンドウ内で実行するレイアウト処理 ─────────
  //  1. 表紙の機器一覧がページに入りきらない分を「点検結果一覧（続き）」ページへ送る（行の高さは折り返しで変わるため実測）
  //  2. 全ページのページ番号と、一覧の「頁」列を振る
  const LAYOUT_JS = `function fitCells(){
    // 入りきらない文字は「…」にせず、まず文字を小さく（最小6.5pt）、それでも入らなければ折り返して全部表示する
    // 印刷時は画面より文字幅がわずかに広くなることがあるため、セル幅の約3%の余裕を見て判定する
    var tds = document.querySelectorAll('.page td');
    var rg = document.createRange();
    var tooWide = function (td) {
      rg.selectNodeContents(td);
      var cs = getComputedStyle(td), box = td.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return rg.getBoundingClientRect().width > box * 0.97;
    };
    for (var i = 0; i < tds.length; i++) {
      var td = tds[i];
      if (getComputedStyle(td).whiteSpace !== 'nowrap' || !td.textContent.trim()) continue;
      if (!tooWide(td)) continue;
      var fs = parseFloat(getComputedStyle(td).fontSize) * 72 / 96;
      while (fs > 6.5 && tooWide(td)) { fs -= 0.3; td.style.fontSize = fs.toFixed(1) + 'pt'; }
      if (tooWide(td)) { td.style.whiteSpace = 'normal'; td.style.lineHeight = '1.2'; td.style.wordBreak = 'break-all'; td.style.textOverflow = 'clip'; }
    }
  }
  function layoutReport(){
    fitCells();
    var MM = 96 / 25.4, cv = document.querySelector('.page.cv');
    var hdr = cv ? cv.querySelector('.hdr').outerHTML.replace('点検結果一覧', '点検結果一覧（続き）') : '';
    for (var page = cv, guard = 0; page && guard < 60; guard++) {
      var tb = page.querySelector('table.list tbody'), foot = page.querySelector('.foot');
      var limit = page.getBoundingClientRect().bottom - 9 * MM - foot.offsetHeight - 2 * MM;
      var rows = tb.rows, cut = -1;
      for (var i = 0; i < rows.length; i++) { if (rows[i].getBoundingClientRect().bottom > limit) { cut = i; break; } }
      if (cut < 0) break;
      if (cut === 0) cut = 1;
      var np = document.createElement('section');
      np.className = 'page cv';
      var tbl = page.querySelector('table.list');
      np.innerHTML = hdr
        + '<div class="sub">' + (page.querySelector('.sub') ? page.querySelector('.sub').innerHTML : '') + '</div>'
        + '<table class="list">' + tbl.querySelector('colgroup').outerHTML + tbl.querySelector('thead').outerHTML + '<tbody></tbody></table>'
        + '<div style="flex:1"></div>' + foot.outerHTML;
      var nb = np.querySelector('tbody');
      while (rows.length > cut) nb.appendChild(rows[cut]);
      page.parentNode.insertBefore(np, page.nextSibling);
      page = np;
    }
    // 機器ごとのページ送り（実測）
    //   入りきらない時は ①写真枠を少し低くする（最低42mm）→ ②写真を次のページへ（写真が無い空枠は消す）
    //   → ③特記事項を次のページへ → ④室内機データを後ろの行から次のページへ、の順に送る
    //   （室内機データを出し切ってから特記事項・写真が続く。特記事項の文字は切らない）
    var over = function (pg) { var f = pg.querySelector('.foot'); return f.getBoundingClientRect().bottom > pg.getBoundingClientRect().bottom - 9 * MM + 1; };
    var excess = function (pg) { var f = pg.querySelector('.foot'); return f.getBoundingClientRect().bottom - (pg.getBoundingClientRect().bottom - 9 * MM) + 2; };
    var nextOf = function (P, mp) {
      var ref = mp.getAttribute('data-ref'), nx = P.nextElementSibling;
      if (nx && nx.getAttribute('data-cont') === ref) return nx;
      var np = document.createElement('section');
      np.className = 'page'; np.setAttribute('data-cont', ref);
      np.innerHTML = mp.querySelector('.hdr').outerHTML
        + '<table class="kanri"><colgroup><col style="width:22mm"><col></colgroup><tr><th>管理情報</th><td class="v">' + mp.getAttribute('data-name') + '</td></tr></table>'
        + '<div class="grow"></div>' + mp.querySelector('.foot').outerHTML;
      P.parentNode.insertBefore(np, P.nextSibling);
      return np;
    };
    var prepend = function (N, el) { var k = N.querySelector('.kanri'); N.insertBefore(el, k.nextSibling); };
    var shrinkPhotos = function (P) {
      var ph = P.querySelector('.photos'); if (!ph || ph.classList.contains('empty')) return false;
      var cells = ph.querySelectorAll('.ph'), rowsN = Math.ceil(cells.length / 3), h0 = cells[0].getBoundingClientRect().height;
      var nh = h0 - excess(P) / rowsN, i;
      if (nh < 42 * MM) return false;
      for (i = 0; i < cells.length; i++) cells[i].style.height = (nh / MM).toFixed(1) + 'mm';
      if (!over(P)) return true;
      for (i = 0; i < cells.length; i++) cells[i].style.height = '';
      return false;
    };
    var mains = document.querySelectorAll('.page[data-ref]');
    for (var mi = 0; mi < mains.length; mi++) {
      var mp = mains[mi], P = mp, ref = mp.getAttribute('data-ref');
      for (var g = 0; g < 400; g++) {
        if (!over(P)) {
          var nx = P.nextElementSibling;
          if (nx && nx.getAttribute('data-cont') === ref) { P = nx; continue; }
          break;
        }
        if (shrinkPhotos(P)) continue;
        var ph = P.querySelector('.photos');
        if (ph) {
          if (ph.classList.contains('empty')) ph.parentNode.removeChild(ph);
          else prepend(nextOf(P, mp), ph);
          continue;
        }
        var memo = P.querySelector('.memo'), iub = P.querySelector('.iublk');
        if (memo && (P === mp || iub)) { prepend(nextOf(P, mp), memo); continue; }
        if (iub) {
          var tb = iub.querySelector('tbody'), N = nextOf(P, mp), nb = N.querySelector('.iublk');
          if (!nb) {
            nb = iub.cloneNode(true); nb.querySelector('tbody').innerHTML = '';
            nb.querySelector('.cap span').textContent = '室内機データ（続き）';
            prepend(N, nb);
          }
          var nt = nb.querySelector('tbody');
          nt.insertBefore(tb.rows[tb.rows.length - 1], nt.firstChild);
          if (!tb.rows.length) { iub.parentNode.removeChild(iub); nb.querySelector('.cap span').textContent = '室内機データ'; }
          continue;
        }
        break;   // これ以上送れない（特記事項が1ページを超えるほど長い等）
      }
    }
    var pages = document.querySelectorAll('.page'), N = pages.length;
    for (var j = 0; j < N; j++) { var s = pages[j].querySelector('.pg'); if (s) s.textContent = (j + 1) + ' / ' + N; }
    var refs = document.querySelectorAll('.pgref');
    for (var k = 0; k < refs.length; k++) {
      for (var n = 0; n < N; n++) if (pages[n].getAttribute('data-ref') === refs[k].getAttribute('data-ref')) { refs[k].textContent = n + 1; break; }
    }
    var bn = document.getElementById('bar-n'); if (bn) bn.textContent = N;
  }`;

  // ファイル名：1台だけ（表紙なし）は「作業報告書-日付 点検種類 系統」、グループは「…現場名」
  R.fileName = function (records, opt) {
    opt = opt || {};
    const r0 = records[0] || {};
    return (records.length === 1 && !opt.cover
      ? `作業報告書-${v(r0, '日付')} ${v(r0, '点検種類')} ${v(r0, '系統')}`
      : `作業報告書-${v(r0, '日付')} ${v(r0, '点検種類')} ${site(r0)}`).replace(/[\\/:*?"<>|]/g, '_').trim();
  };

  // ───────── 組み立て ─────────
  R.build = function (records, opt) {
    opt = Object.assign({ cover: true, group: '' }, opt);
    const group = opt.group || v(records[0] || {}, '点検グループ');
    // ページ割り付け
    const pages = [];
    if (opt.cover) pages.push({ type: 'cover' });
    records.forEach(rec => {
      pages.push({ type: 'main', rec, ref: 'm' + records.indexOf(rec), iu: indoorRows(rec) });
    });
    const body = pages.map(p => {
      if (p.type === 'cover') return coverHTML(records, group);
      const foot = `<div class="foot"><span>${esc(group)}　／　${esc(v(p.rec, '系統'))}</span><span class="pg"></span></div>`;
      const name = `${esc(v(p.rec, '系統'))}　（${esc(v(p.rec, '型式'))}）`;
      return `<section class="page" data-ref="${p.ref}" data-name="${esc(name)}">${headerHTML('作 業 報 告 書')}${custHTML(p.rec)}${infoHTML(p.rec)}${visualHTML(p.rec)}${measureHTML(p.rec)}${indoorHTML(p.iu, 1, false)}${memoHTML(p.rec)}${photosHTML(p.rec, opt.images)}<div class="grow"></div>${foot}</section>`;
    }).join('\n');
    const r0 = records[0] || {};
    const fileName = R.fileName(records, opt);
    return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>${esc(fileName)}</title><style>${R.CSS}${opt.pdf ? '.bar{display:none}html,body{background:#fff}.page{margin:0;box-shadow:none}' : ''}</style></head><body>
      <div class="bar"><b>${esc(records.length === 1 && !opt.cover ? v(r0, '系統') : group)}</b><span>${records.length}台 ・ <span id="bar-n"></span>ページ</span><button onclick="print()">印刷 / PDFに保存</button><span>印刷画面の送信先で「PDFに保存」を選ぶとPDFになります</span></div>
      ${body}
      <script>${LAYOUT_JS}
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(function(){ layoutReport(); setTimeout(function(){ ${opt.autoPrint === false ? '' : 'print();'} }, 400); });<\/script></body></html>`;
  };

  // ───────── 出力ウィンドウ ─────────
  // ポップアップブロックを避けるため、クリック直後に R.prepareWindow() でウィンドウを開いてから中身を作る
  R.prepareWindow = function () {
    const w = window.open('', '_blank');
    if (!w) { alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。'); return null; }
    w.document.write('<link rel="icon" href="data:,"><meta name="viewport" content="width=device-width"><p style="font-family:sans-serif;padding:24px">報告書を作成しています...</p>');
    return w;
  };
  R.message = function (w, msg, err) { try { w.document.body.innerHTML = `<p style="font-family:sans-serif;padding:24px;${err ? 'color:#c00' : ''}">${esc(msg)}</p>`; } catch (e) { /* 閉じられた */ } };
  R.render = function (w, records, opt) { const html = R.build(records, opt); w.document.open(); w.document.write(html); w.document.close(); };

  // ───────── kintone：1レコードだけ出力（レコード詳細画面のボタン） ─────────
  R.openRecord = async function (recordId) {
    const w = R.prepareWindow(); if (!w) return;
    try {
      const appId = (kintone.app && kintone.app.getId && kintone.app.getId()) || (kintone.mobile && kintone.mobile.app.getId());
      const r = await kintone.api(kintone.api.url('/k/v1/record', true), 'GET', { app: appId, id: recordId });
      const images = await R.loadImages([r.record], (d, n) => R.message(w, `写真を読み込んでいます... ${d} / ${n}`));
      R.render(w, [r.record], { cover: false, images });
    } catch (e) {
      console.error('[group_report]', e);
      R.message(w, '作成できませんでした：' + (e.message || e), true);
    }
  };

  // ───────── kintone から開く ─────────
  R.open = async function (group, opt) {
    const w = window.open('', '_blank');
    if (!w) { alert('ポップアップがブロックされました。ブラウザの設定で kintone のポップアップを許可してください。'); return; }
    w.document.write('<p style="font-family:sans-serif;padding:24px">報告書を作成しています...</p>');
    try {
      const q = `点検グループ = "${String(group).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}" order by $id asc limit 500`;
      const r = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', { app: kintone.app.getId(), query: q });
      if (!r.records.length) { w.document.body.innerHTML = '<p style="padding:24px">レコードがありません</p>'; return; }
      const images = await R.loadImages(r.records, (d, n) => { w.document.body.innerHTML = `<p style="font-family:sans-serif;padding:24px">写真を読み込んでいます... ${d} / ${n}</p>`; });
      const html = R.build(r.records, Object.assign({ group, images }, opt));
      w.document.open(); w.document.write(html); w.document.close();
    } catch (e) {
      console.error('[group_report]', e);
      w.document.body.innerHTML = '<p style="padding:24px;color:#c00">作成できませんでした：' + esc(e.message || e) + '</p>';
    }
  };

  // ───────── PDFファイルを直接作る（印刷が使えないホーム画面のWEBアプリ用） ─────────
  //   報告書を画面外で組み立て → 1ページずつ画像にして（約200dpi）→ A4のPDFにまとめる
  //   ※ 文字も画像になる（検索・コピー不可）。PC は従来どおり「印刷 → PDFに保存」を使う
  const LIBS = {
    html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  };
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`) && (src.indexOf('html2canvas') < 0 || global.html2canvas) && (src.indexOf('jspdf') < 0 || global.jspdf)) return resolve();
      const sc = document.createElement('script');
      sc.src = src; sc.onload = () => resolve(); sc.onerror = () => reject(new Error('PDF作成の部品を読み込めませんでした（通信を確認してください）'));
      document.head.appendChild(sc);
    });
  }
  R.makePdf = async function (records, opt, progress) {
    opt = Object.assign({ cover: false }, opt, { autoPrint: false, pdf: true });
    if (progress) progress('PDF作成の準備中...');
    if (!global.html2canvas) await loadScript(LIBS.html2canvas);
    if (!global.jspdf) await loadScript(LIBS.jspdf);

    // 画面外に報告書を組み立てる（見えない位置に置くが、描画はさせる）
    const fr = document.createElement('iframe');
    fr.setAttribute('aria-hidden', 'true');
    fr.style.cssText = 'position:fixed;left:-10000px;top:0;width:820px;height:1200px;border:0;visibility:visible';
    document.body.appendChild(fr);
    try {
      await new Promise(res => { fr.onload = res; fr.srcdoc = R.build(records, opt); });
      const doc = fr.contentDocument;
      for (let t = 0; t < 200; t++) {                 // レイアウト（ページ送り）が終わるまで待つ
        const bn = doc.getElementById('bar-n');
        if (bn && bn.textContent) break;
        await new Promise(r => setTimeout(r, 50));
      }
      await Promise.all([...doc.images].map(im => (im.decode ? im.decode().catch(() => {}) : null)));
      // SVG画像（ロゴ）は画像化ツールで正しい大きさに描かれないため、表示サイズの4倍の PNG に置き換える
      await Promise.all([...doc.images].filter(im => /^data:image\/svg|\.svg(\?|$)/i.test(im.src)).map(im => new Promise(res => {
        const w = im.clientWidth, h = im.clientHeight; if (!w || !h) return res();
        const cv = doc.createElement('canvas'); cv.width = w * 4; cv.height = h * 4;
        const src = new Image();
        src.onload = () => { cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height); im.style.width = w + 'px'; im.style.height = h + 'px'; im.onload = res; im.onerror = res; im.src = cv.toDataURL('image/png'); };
        src.onerror = res; src.src = im.src;
      })));
      const pages = [...doc.querySelectorAll('.page')];
      const pdf = new global.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
      for (let i = 0; i < pages.length; i++) {
        if (progress) progress(`PDFを作成中... ${i + 1} / ${pages.length} ページ`);
        const canvas = await global.html2canvas(pages[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
          windowWidth: pages[i].scrollWidth, windowHeight: pages[i].scrollHeight });
        if (i) pdf.addPage('a4', 'portrait');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        canvas.width = canvas.height = 0;            // メモリ解放
      }
      return { blob: pdf.output('blob'), name: R.fileName(records, opt) + '.pdf', pages: pages.length };
    } finally { fr.remove(); }
  };

  // 写真をダウンロードして縮小（長い辺1000px）→ { fileKey: dataURL }
  R.loadImages = async function (records, progress) {
    const keys = [...new Set(records.flatMap(R.photoKeys))], out = {}, C = global.InspCore;
    const gm = location.pathname.match(/^\/k\/guest\/\d+/), base = gm ? gm[0] : '/k';
    let done = 0, i = 0;
    async function worker() {
      while (i < keys.length) {
        const k = keys[i++];
        try {
          const res = await fetch(`${base}/v1/file.json?fileKey=${encodeURIComponent(k)}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const blob = await res.blob();
          out[k] = C && C.resizeImage ? await C.resizeImage(blob, 1000, 0.82) : URL.createObjectURL(blob);
        } catch (e) { console.warn('[group_report] 写真を取得できませんでした', k, e); }
        if (progress) progress(++done, keys.length);
      }
    }
    if (keys.length) { if (progress) progress(0, keys.length); await Promise.all([worker(), worker(), worker(), worker()]); }
    return out;
  };

  global.InspReport = R;
})(window);
