FROM node:16-alpine as build

WORKDIR /app

# 의존성 파일 복사 및 설치
COPY package.json package-lock.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# 프로덕션 환경을 위한 nginx 기반 이미지
FROM nginx:alpine

# nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물 복사
COPY --from=build /app/build /usr/share/nginx/html

# 80 포트 노출
EXPOSE 80

# nginx 시작
CMD ["nginx", "-g", "daemon off;"] 