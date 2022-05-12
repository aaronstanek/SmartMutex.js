class Queue {
    #_length;
    #_head;
    #_tail;
    constructor() {
        this.clear();
    }
    clear() {
        this.#_length = 0;
        this.#_head = null;
        this.#_tail = null;
    }
    length() {
        return this.#_length;
    }
    push(elem) {
        if (this.#_length >= Number.MAX_SAFE_INTEGER) {
            throw "max-queue-size-reached";
        }
        else {
            let x = [elem,null];
            if (this.#_length) {
                this.#_tail[1] = x;
            }
            else {
                this.#_head = x;
            }
            this.#_tail = x;
            this.#_length += 1;
        }
    }
    pop() {
        if (this.#_length < 2) {
            if (this.#_length < 1) {
                throw "pop-empty-queue";
            }
            else {
                let x = this.#_head[0];
                this.clear();
                return x;
            }
        }
        else {
            let x = this.#_head[0];
            this.#_head = this.#_head[1];
            this.#_length -= 1;
            return x;
        }
    }
};

class SmartMutex {
    #_queue;
    #_active_on;
    #_active_token;
    #_active_checkin;
    #_monitor_on;
    #_monitor_strikes;
    #_monitor_baseline;
    #_monitor_call;
    constructor() {
        this.#_queue = new Queue();
        this.#_active_on = false;
        this.#_active_token = {};
        this.#_active_checkin = 0;
        this.#_monitor_on = false;
        this.#_monitor_strikes = 0;
        this.#_monitor_baseline = 0;
        this.#_monitor_call = this.#monitor.bind(this);
    }
    #monitor() {
        if (this.#_active_on) {
            setTimeout(this.#_monitor_call,100);
            if (this.#_active_checkin > this.#_monitor_baseline) {
                this.#_monitor_strikes = 0;
                this.#_monitor_baseline = this.#_active_checkin;
            }
            else if (this.#_monitor_strikes >= 3) {
                // the task is unresponsive
                // force release mutex
                this.#_monitor_strikes = 0;
                this.#release(this.#_active_token);
            }
            else {
                this.#_monitor_strikes += 1;
            }
        }
        else {
            this.#_monitor_on = false;
        }
    }
    #run(f) {
        let token = {};
        let controls = {
            "release": ()=>{this.#release(token)},
            "checkin": ()=>{
                if (token === this.#_active_token) {
                    this.#_active_checkin = Date.now();
                    return true;
                }
                else {
                    return false;
                }
            }
        };
        try {
            setTimeout(f,0,controls);
        }
        catch(e) {
            return false;
        }
        this.#_active_on = true;
        this.#_active_token = token;
        this.#_active_checkin = Date.now();
        if (!this.#_monitor_on) {
            this.#_monitor_on = true;
            this.#_monitor_strikes = 0;
            setTimeout(this.#_monitor_call,100);
        }
        return true;
    }
    #release(token) {
        if (token === this.#_active_token) {
            this.#_active_on = false;
            this.#_active_token = {};
            while (this.#_queue.length()) {
                if (this.#run(this.#_queue.pop())) {
                    return;
                }
            }
        }
    }
    acquire(f) {
        if (this.#_active_on) {
            this.#_queue.push(f);
        }
        else {
            this.#run(f);
        }
    }
};