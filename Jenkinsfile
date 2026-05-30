pipeline {
    agent any 
    environment {
        DOCKER_HUB_USER = 'yjawlekar'
        Image = 'finscope'
    }
    
    stages {
        stage ("build") {
            steps {
                sh "docker build -t ${DOCKER_HUB_USER}/${Image}:latest ."
            }
	}
        stage ("push") {
            steps { 
                script{
                withCredentials([usernamePassword(credentialsId: '50173758-23c8-433e-b21c-28fe28108752',
                                                    usernameVariable: 'USER',
                                                    passwordVariable: 'PASS')]) {
                        // 1. LOGIN using the variables from the vault
                        sh "echo ${PASS}| docker login -u ${USER} --password-stdin"
                         // 2. PUSH using your environment variables
                        sh "docker push ${DOCKER_HUB_USER}/${Image}:latest"
                 }
                }
               }
            }
            
        stage ("deploy") {
            steps {
                sh "docker rm -f finscope-app || true"
                sh "docker run -d -p 3000:3000 --name finscope-app ${DOCKER_HUB_USER}/${Image}:latest"
                }
            }
	    stage("Deploy to Render") {
            steps {
               // This 'curl' command pings Render to start the update
              // PASTE YOUR URL BELOW INSIDE THE QUOTES
              sh "curl -X POST 'https://api.render.com/deploy/srv-d8d89v0js32c73fac2m0?key=Jhb9K1X-i6c'"
          }
     }
		
        }
}
