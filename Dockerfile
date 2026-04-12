# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY shared/ ./shared/
COPY site/ ./site/
COPY admin/ ./admin/

# Install deps
RUN cd shared && npm ci
RUN cd site && npm ci
RUN cd admin && npm ci

# Generate Prisma client everywhere
RUN cd shared && npx prisma generate
RUN cp -r shared/node_modules/.prisma site/node_modules/.prisma
RUN cp -r shared/node_modules/.prisma admin/node_modules/.prisma

ENV NEXT_PUBLIC_SITE_NAME="Magical Threads with Meg"
ENV NEXT_PUBLIC_SITE_URL=https://magicalthreadswithmeg.com
ENV NEXT_PUBLIC_INSTAGRAM_HANDLE=magicalthreadswithmeg
ENV NEXT_PUBLIC_CONTACT_EMAIL=meg@magicalthreadswithmeg.com
ENV NEXT_PUBLIC_STRIPE_MODE=test
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TLBvsJ4oVzt4WEZvdImB652uiNhKZ6tYjSppeC2Ke8lwVVItW8WiOiICyEQT8tovw1ZLSwVWVi6baVYfk7O72Jo00H5z0JZo2

# Build both - cache bust with unique timestamp
RUN echo "build-bust-20260411-1425" && cd site && npm run build
RUN cd admin && npm run build

# ---- Production ----
FROM node:22-alpine AS production
WORKDIR /app

COPY --from=build /app/shared ./shared

# Site standalone
COPY --from=build /app/site/.next/standalone ./site-standalone/
COPY --from=build /app/site/.next/static ./site-standalone/.next/static
COPY --from=build /app/site/public ./site-standalone/public

# Admin standalone
COPY --from=build /app/admin/.next/standalone ./admin-standalone/
COPY --from=build /app/admin/.next/static ./admin-standalone/.next/static

COPY deploy/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV NODE_ENV=production

EXPOSE 3000 3001

ENTRYPOINT ["/app/entrypoint.sh"]
