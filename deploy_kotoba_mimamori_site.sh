#!/bin/sh

# 「ことばみまもり」( https://words-watching-app.na0aaooq.com/ )のデプロイスクリプト 
BASE_DIR="."
ENV_FILE=".env"

if [ -f "${ENV_FILE}" ] ; then
  source ${ENV_FILE}
else
  echo "環境変数を定義したファイル [${ENV_FILE}] が存在しません。"
  exit 1
fi
S3_BUKKET_NAME=`echo ${PORTFOLIO_SITE_S3_BUKKET_NAME}`

if [ -n "${S3_BUKKET_NAME}" ] ; then
  echo "S3バケット [${S3_BUKKET_NAME}] へのデプロイを開始します。"
else
  echo "[${ENV_FILE}] 内にデプロイ先のS3バケット名が定義されていません。"
  exit 1
fi

if [ -d "${BASE_DIR}" ] ; then

  cd ${BASE_DIR}

  echo "S3バケット [${S3_BUKKET_NAME}] へデプロイする対象ファイルです。"
  aws s3 sync . ${S3_BUKKET_NAME} --exclude "*" --include "*.html" --include "*.css" \
    --delete \
    --exclude "node_modules/*" \
    --exclude "${ENV_FILE}" \
    --exclude "aws/*" \
    --exclude "BACKUP/*" \
    --exclude ".DS_Store" \
    --exclude "assets/.DS_Store" \
    --exclude "deploy_kotoba_mimamori_site.sh" \
    --dryrun

  printf "S3バケットへのデプロイを実行しますか？ [y/N]: "
  read ANS

  case $ANS in
    [Yy]* )
      echo "S3バケット [${S3_BUKKET_NAME}] へデプロイします。"
      aws s3 sync . ${S3_BUKKET_NAME} --exclude "*" --include "*.html" --include "*.css" \
        --delete \
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

else
  echo "デプロイ対象ディレクトリ [${BASE_DIR}] が存在しません。"
fi
