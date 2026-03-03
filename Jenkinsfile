#!/usr/bin/env groovy
// Copyright (c) 2026 Son Nguyen
// Declarative Jenkins Pipeline for WealthWise
//
// Prerequisites (Jenkins agent):
//   - Jenkins NodeJS Plugin configured with installation named "NodeJS-20"
//   - Docker (buildx) installed and accessible to the Jenkins user
//   - Credential ID "ghcr-credentials": Username/Password for ghcr.io
//   - Credential ID "kubeconfig-production": Secret file — production kubeconfig
//   - Credential ID "kubeconfig-staging":    Secret file — staging kubeconfig

pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'   // Jenkins NodeJS Plugin → Global Tool Configuration
    }

    environment {
        TURBO_DAEMON            = 'false'
        NEXT_TELEMETRY_DISABLED = '1'
        GHCR_REGISTRY           = 'ghcr.io'
        GHCR_OWNER              = 'hoangsonww'
        API_IMAGE               = "${GHCR_REGISTRY}/${GHCR_OWNER}/wealthwise-api"
        WEB_IMAGE               = "${GHCR_REGISTRY}/${GHCR_OWNER}/wealthwise-web"
        // Placeholder env vars required by Next.js at build time (real values injected at runtime)
        NEXTAUTH_URL            = 'http://localhost:3000'
        NEXTAUTH_SECRET         = 'ci-placeholder-not-a-real-secret-do-not-use'
        NEXT_PUBLIC_API_URL     = 'http://localhost:4000/api/v1'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '5'))
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds(abortPrevious: true)
        timestamps()
        ansiColor('xterm')
    }

    stages {

        // ────────────────────────────────────────────────────────────────
        //  ⚙️ 0. Preflight — compute metadata, log environment
        // ────────────────────────────────────────────────────────────────
        stage('⚙️ Preflight') {
            steps {
                script {
                    env.GIT_SHORT = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
                    env.IS_MAIN   = (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'master') ? 'true' : 'false'
                }
                sh '''
                    echo "╔══════════════════════════════════════╗"
                    echo "║     WealthWise CI/CD Pipeline        ║"
                    echo "╚══════════════════════════════════════╝"
                    echo ""
                    echo "  Branch  : $BRANCH_NAME"
                    echo "  Commit  : $GIT_SHORT"
                    echo "  Build   : $BUILD_NUMBER"
                    echo "  Node    : $(node -v)"
                    echo "  npm     : $(npm -v)"
                    echo "  Docker  : $(docker version --format '{{.Client.Version}}' 2>/dev/null || echo unavailable)"
                    echo "  Is main : $IS_MAIN"
                '''
            }
        }

        // ────────────────────────────────────────────────────────────────
        //  💾 1. Install — npm ci for all workspace packages
        // ────────────────────────────────────────────────────────────────
        stage('💾 Install') {
            steps {
                sh 'npm ci'
            }
        }

        // ────────────────────────────────────────────────────────────────
        //  🔍 2. Check — parallel format / type / audit
        // ────────────────────────────────────────────────────────────────
        stage('🔍 Check') {
            parallel {
                stage('🧹 Format (Prettier)') {
                    steps {
                        sh 'npm run format:check'
                    }
                }
                stage('🔷 TypeScript') {
                    steps {
                        sh 'npm run lint'
                    }
                }
                stage('🛡️ Security Audit') {
                    steps {
                        sh 'npm audit --audit-level=high || true'
                    }
                }
            }
        }

        // ────────────────────────────────────────────────────────────────
        //  🧪 3. Test — three packages in parallel
        //         API tests use mongodb-memory-server (no external DB)
        // ────────────────────────────────────────────────────────────────
        stage('🧪 Test') {
            parallel {
                stage('shared-types (151)') {
                    steps {
                        sh 'npx turbo test --filter=@wealthwise/shared-types'
                    }
                    post {
                        always {
                            junit(
                                testResults: 'packages/shared-types/test-results/**/*.xml',
                                allowEmptyResults: true
                            )
                        }
                    }
                }
                stage('API (138)') {
                    options {
                        timeout(time: 10, unit: 'MINUTES')
                    }
                    steps {
                        sh 'npx turbo test --filter=@wealthwise/api'
                    }
                    post {
                        always {
                            junit(
                                testResults: 'apps/api/test-results/**/*.xml',
                                allowEmptyResults: true
                            )
                        }
                    }
                }
                stage('Web (41)') {
                    steps {
                        sh 'npx turbo test --filter=@wealthwise/web'
                    }
                    post {
                        always {
                            junit(
                                testResults: 'apps/web/test-results/**/*.xml',
                                allowEmptyResults: true
                            )
                        }
                    }
                }
            }
        }

        // ────────────────────────────────────────────────────────────────
        //  🏗️ 4. Build — compile API + Next.js in parallel
        //         Turbo resolves shared-types dependency automatically
        // ────────────────────────────────────────────────────────────────
        stage('🏗️ Build') {
            parallel {
                stage('API') {
                    steps {
                        sh 'npx turbo build --filter=@wealthwise/api...'
                    }
                    post {
                        success {
                            archiveArtifacts(
                                artifacts: 'apps/api/dist/**',
                                allowEmptyArchive: true,
                                fingerprint: true
                            )
                        }
                    }
                }
                stage('Web (Next.js)') {
                    steps {
                        sh 'npx turbo build --filter=@wealthwise/web...'
                    }
                    post {
                        success {
                            archiveArtifacts(
                                artifacts: 'apps/web/.next/**',
                                allowEmptyArchive: true,
                                fingerprint: true
                            )
                        }
                    }
                }
            }
        }

        // ────────────────────────────────────────────────────────────────
        //  🐳 5. Docker — build multi-arch images and push to GHCR
        //         Only runs on main / master branches
        //         Uses Dockerfile.prod (hardened: dumb-init, non-root)
        // ────────────────────────────────────────────────────────────────
        stage('🐳 Docker') {
            when {
                anyOf { branch 'main'; branch 'master' }
            }
            parallel {
                stage('API → GHCR') {
                    environment {
                        DOCKER_CREDS = credentials('ghcr-credentials')
                    }
                    steps {
                        sh '''
                            echo "$DOCKER_CREDS_PSW" | \
                              docker login ghcr.io -u "$DOCKER_CREDS_USR" --password-stdin

                            docker buildx create --use --name ww-builder-api \
                              --driver docker-container \
                              --driver-opt network=host 2>/dev/null || \
                            docker buildx use ww-builder-api

                            docker buildx build \
                              --platform linux/amd64,linux/arm64 \
                              --file apps/api/Dockerfile.prod \
                              --tag $API_IMAGE:$GIT_SHORT \
                              --tag $API_IMAGE:latest \
                              --cache-from type=registry,ref=$API_IMAGE:buildcache \
                              --cache-to  type=registry,ref=$API_IMAGE:buildcache,mode=max \
                              --push \
                              .
                        '''
                    }
                    post {
                        always { sh 'docker logout ghcr.io || true' }
                    }
                }
                stage('Web → GHCR') {
                    environment {
                        DOCKER_CREDS = credentials('ghcr-credentials')
                    }
                    steps {
                        sh '''
                            echo "$DOCKER_CREDS_PSW" | \
                              docker login ghcr.io -u "$DOCKER_CREDS_USR" --password-stdin

                            docker buildx create --use --name ww-builder-web \
                              --driver docker-container \
                              --driver-opt network=host 2>/dev/null || \
                            docker buildx use ww-builder-web

                            docker buildx build \
                              --platform linux/amd64,linux/arm64 \
                              --file apps/web/Dockerfile.prod \
                              --tag $WEB_IMAGE:$GIT_SHORT \
                              --tag $WEB_IMAGE:latest \
                              --cache-from type=registry,ref=$WEB_IMAGE:buildcache \
                              --cache-to  type=registry,ref=$WEB_IMAGE:buildcache,mode=max \
                              --push \
                              .
                        '''
                    }
                    post {
                        always { sh 'docker logout ghcr.io || true' }
                    }
                }
            }
        }

        // ────────────────────────────────────────────────────────────────
        //  🚀 6. Deploy Staging — kubectl rollout on the staging cluster
        //         Only runs on main / master after successful Docker push
        // ────────────────────────────────────────────────────────────────
        stage('🚀 Deploy Staging') {
            when {
                anyOf { branch 'main'; branch 'master' }
            }
            environment {
                KUBECONFIG_FILE = credentials('kubeconfig-staging')
            }
            steps {
                sh '''
                    export KUBECONFIG="$KUBECONFIG_FILE"

                    # Update images to the freshly pushed SHA tag
                    kubectl set image deployment/wealthwise-api \
                      api=$API_IMAGE:$GIT_SHORT \
                      -n wealthwise-staging --record || true

                    kubectl set image deployment/wealthwise-web \
                      web=$WEB_IMAGE:$GIT_SHORT \
                      -n wealthwise-staging --record || true

                    # Wait for rollout to complete (5-minute timeout)
                    kubectl rollout status deployment/wealthwise-api \
                      -n wealthwise-staging --timeout=5m

                    kubectl rollout status deployment/wealthwise-web \
                      -n wealthwise-staging --timeout=5m

                    echo "✅ Staging deployed: $API_IMAGE:$GIT_SHORT"
                '''
            }
        }

        // ────────────────────────────────────────────────────────────────
        //  🔐 7. Production Gate — manual approval before prod deploy
        // ────────────────────────────────────────────────────────────────
        stage('🔐 Production Gate') {
            when {
                anyOf { branch 'main'; branch 'master' }
            }
            steps {
                input(
                    message: "Deploy ${env.GIT_SHORT} to production?",
                    ok: 'Deploy',
                    submitterParameter: 'APPROVER'
                )
                echo "✅ Approved by: ${env.APPROVER}"
            }
        }

        // ────────────────────────────────────────────────────────────────
        //  🚀 8. Deploy Production — kubectl rollout on the prod cluster
        // ────────────────────────────────────────────────────────────────
        stage('🚀 Deploy Production') {
            when {
                anyOf { branch 'main'; branch 'master' }
            }
            environment {
                KUBECONFIG_FILE = credentials('kubeconfig-production')
            }
            steps {
                sh '''
                    export KUBECONFIG="$KUBECONFIG_FILE"

                    kubectl set image deployment/wealthwise-api \
                      api=$API_IMAGE:$GIT_SHORT \
                      -n wealthwise-production --record || true

                    kubectl set image deployment/wealthwise-web \
                      web=$WEB_IMAGE:$GIT_SHORT \
                      -n wealthwise-production --record || true

                    kubectl rollout status deployment/wealthwise-api \
                      -n wealthwise-production --timeout=10m

                    kubectl rollout status deployment/wealthwise-web \
                      -n wealthwise-production --timeout=10m

                    echo "✅ Production deployed: $API_IMAGE:$GIT_SHORT"
                '''
            }
        }

    } // end stages

    post {
        always {
            echo "🏁 Pipeline finished — branch: ${env.BRANCH_NAME}, commit: ${env.GIT_SHORT}"
            cleanWs(
                cleanWhenAborted: true,
                cleanWhenFailure: true,
                cleanWhenNotBuilt: true,
                cleanWhenSuccess: true,
                cleanWhenUnstable: true,
                deleteDirs: true
            )
        }
        success {
            echo "✅ Build #${env.BUILD_NUMBER} succeeded"
        }
        failure {
            echo "❌ Build #${env.BUILD_NUMBER} failed — check logs at ${env.BUILD_URL}"
        }
        unstable {
            echo "⚠️  Build #${env.BUILD_NUMBER} is unstable"
        }
    }
}
