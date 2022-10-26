package client

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"
)

type Command struct {
	Interval    int    `json:"interval"`
	Service     string `json:"service"`
	ServiceHost string `json:"serviceHost"`
}

type HsdClient struct {
	ServerURL     string
	Authorization string
	Interval      int // in seconds
	Command       Command
}

func (h *HsdClient) Start() chan bool {
	stop := make(chan bool)
	intervalChan := time.Tick(time.Duration(h.Interval) * time.Second)

	go func() {
		for {
			// run the actual work
			if err := h.doHeartbeat(); err != nil {
				log.Println("heartbeat error: ", err)
			}

			// then select the signal
			select {
			case <-intervalChan:
				// continue

			case <-stop:
				return
			}
		}
	}()

	return stop
}

func (h *HsdClient) doHeartbeat() (err error) {
	msg, err := json.Marshal(h.Command)
	if err != nil {
		return
	}
	reqBody := strings.NewReader(string(msg))

	request, _ := http.NewRequest("PUT", h.ServerURL, reqBody)
	request.Header.Add("accept", "application/json")
	request.Header.Add("content-type", "application/json")
	request.Header.Add("authorization", h.Authorization)

	res, err := (&http.Client{
		Timeout: time.Second * 2,
	}).Do(request)

	if err != nil {
		return
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		msg := fmt.Sprintf("Error with status code: %d", res.StatusCode)
		err = errors.New(msg)
		return
	}
	return
}
