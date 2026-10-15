pipeline {
  agent { label 'agent-1' }
  environment {
    IMAGE = 'sham22/url-shortener'
    KUBECONFIG = '/etc/rancher/k3s/k3s.yaml'
  }
  stages {
    stage('Build Image') {
      steps { sh 'docker build -t $IMAGE:$BUILD_NUMBER .' }
    }
    stage('Push Image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh '''
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
            docker push $IMAGE:$BUILD_NUMBER
          '''
        }
      }
    }
    stage('Deploy to Kubernetes') {
      steps {
        sh '''
          sed -i "s|image: $IMAGE:.*|image: $IMAGE:$BUILD_NUMBER|" k8s/20-app.yaml
          sed -i "s|APP_VERSION: .*|APP_VERSION: '$BUILD_NUMBER'|" k8s/20-app.yaml
          kubectl apply -f k8s/
          kubectl rollout status deployment/url-shortener -n urlshort --timeout=120s
        '''
      }
    }
  }
  post { always { sh 'docker logout || true' } }
}
