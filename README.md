# Simple Schedule Online

An online simple schedule generator based on [SimpleSMTScheduler](https://github.com/egk696/SimpleSMTScheduler)
To use the application online: [Simple Cyclic Scheduler Online](https://simplescheduleronline.herokuapp.com/)  
### Quick Start for local dev:
Spin up the containers with:
```bash
docker-compose up -d --build -V
```
Then open your browser to http://localhost:5004

To check-up on your containers do:
```bash
docker ps
```
Read the logs of a container with:
```bash
docker logs [containerid]
```
Kill your containers:
```bash
docker stop $(docker ps -aq)
```

