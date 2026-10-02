pipeline {
  agent { docker { image 'node:20' } }
  environment { CI = 'true' }
  stages {
    stage('Install') { steps { sh 'npm install' } }
    stage('Lint')    { steps { sh 'npm run lint' } }
    stage('Test')    { steps { sh 'npm test' } }
    stage('Build')   { steps { sh 'npm run build' } }
    stage('Deploy to Netlify') {
      when { branch 'main' }
      steps {
        withCredentials([string(credentialsId: 'netlify-token', variable: 'NETLIFY_AUTH_TOKEN'),
                         string(credentialsId: 'netlify-site-id', variable: 'NETLIFY_SITE_ID')]) {
          sh 'npx netlify-cli deploy --dir=dist --prod'
        }
      }
    }
  }
  post { always { archiveArtifacts artifacts: 'dist/**', allowEmptyArchive: true } }
}
