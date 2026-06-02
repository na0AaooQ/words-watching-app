#!/bin/sh

# 「ことばみまもり」( https://words-watching-app.na0aaooq.com/ )のデプロイスクリプト 
set -eu

BASE_DIR="."
ENV_FILE=".env"
DRYRUN_ONLY=0

if [ "${1:-}" = "--dryrun" ] ; then
  DRYRUN_ONLY=1
elif [ "$#" -gt 0 ] ; then
  echo "使い方: $0 [--dryrun]"
  exit 1
fi

print_deploy_targets() {
  echo "ローカルでデプロイ対象候補を確認します。"
  find . \
    -path "./.git" -prune -o \
    -path "./node_modules" -prune -o \
    -path "./aws" -prune -o \
    -path "./BACKUP" -prune -o \
    -type f \( -name "*.html" -o -name "*.css" -o -name "sitemap.xml" \) -print | sort
}

if [ ! -d "${BASE_DIR}" ] ; then
  echo "デプロイ対象ディレクトリ [${BASE_DIR}] が存在しません。"
  exit 1
fi

cd "${BASE_DIR}"

if [ "${DRYRUN_ONLY}" -eq 1 ] ; then
  print_deploy_targets
  exit 0
fi

if [ -f "${ENV_FILE}" ] ; then
  . "./${ENV_FILE}"
else
  echo "環境変数を定義したファイル [${ENV_FILE}] が存在しません。"
  exit 1
fi
S3_BUKKET_NAME="${PORTFOLIO_SITE_S3_BUKKET_NAME:-}"

if [ -n "${S3_BUKKET_NAME}" ] ; then
  echo "S3バケット [${S3_BUKKET_NAME}] へのデプロイを開始します。"
else
  echo "[${ENV_FILE}] 内にデプロイ先のS3バケット名が定義されていません。"
  exit 1
fi

echo "S3バケット [${S3_BUKKET_NAME}] へデプロイする対象ファイルです。"
aws s3 sync . "${S3_BUKKET_NAME}" --exclude "*" --include "*.html" --include "en/*.html" --include "*.css" --include "assets/css/*.css" --include "sitemap.xml" \
    --delete \
    --size-only \
    --exclude ".git/*" \
    --exclude ".env.example" \
    --exclude ".env" \
    --exclude "node_modules/*" \
    --exclude "${ENV_FILE}" \
    --exclude "aws/*" \
    --exclude "BACKUP/*" \
    --exclude ".DS_Store" \
    --exclude "assets/.DS_Store" \
    --exclude "deploy_kotoba_mimamori_site.sh" \
    --dryrun

printf "S3バケットへのデプロイを実行しますか？ [y/N]: "
read ANS || ANS=""

case $ANS in
  [Yy]* )
    echo "S3バケット [${S3_BUKKET_NAME}] へデプロイします。"
    aws s3 sync . "${S3_BUKKET_NAME}" --exclude "*" --include "*.html" --include "en/*.html" --include "*.css" --include "assets/css/*.css" --include "sitemap.xml" \
        --delete \
        --size-only \
        --exclude ".git/*" \
        --exclude ".env.example" \
        --exclude ".env" \
        --exclude "node_modules/*" \
        --exclude "${ENV_FILE}" \
        --exclude "aws/*" \
        --exclude "BACKUP/*" \
        --exclude ".DS_Store" \
        --exclude "assets/.DS_Store" \
        --exclude "deploy_kotoba_mimamori_site.sh" \
    ;;
  * )
    echo "S3バケット [${S3_BUKKET_NAME}] へのデプロイをキャンセルします。"
    ;;
esac
