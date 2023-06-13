import { EnvironmentRecord, PrivateEnvironmentRecord } from "../Environment Records/Environment Records"
import { FunctionObject } from "./Function Object"
import { RealmRecord } from "./Realm"

class ExecutionContext {
    codeEvaluationState: any // for async function and generator to suspend and resume executionContext
    function: FunctionObject | null | undefined   
    realm: RealmRecord
    scriptOrModule: any
}

class ECMAScriptCodeExecutionContext extends ExecutionContext{
    lexicalEnvironment: EnvironmentRecord
    variableEnvironment: EnvironmentRecord
    privateEnvironment: PrivateEnvironmentRecord | null
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
    ExecutionContextStack,
    ECMAScriptCodeExecutionContext
}