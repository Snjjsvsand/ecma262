import { RealmRecord } from "./Realm"

class ExecutionContext {
    codeEvaluationState: any // for async function and generator to suspend executionContext
    function: Function | null | undefined   
    realm: RealmRecord
    scriptOrModule: any
}

class ExecutionContextStack {
    arr: ExecutionContext[]
    
    isEmpty() {
        return Boolean(this.arr.length)
    }

    top() {
        if(this.isEmpty()) return undefined
        return this.arr[this.arr.length - 1]
    }

    pop() {
        return this.arr.pop()
    }

    push(context: ExecutionContext) {
        this.arr.push(context)
    }
}


export {
    ExecutionContext,
    ExecutionContextStack
}