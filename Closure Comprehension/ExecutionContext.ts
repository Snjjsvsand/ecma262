import { getIdentifierReference } from "../Environment Records/Environment Record Operations"
import { EnvironmentRecord, PrivateEnvironmentRecord } from "../Environment Records/Environment Records"
import { agent } from "./Agent"
import { FunctionObject as FunctionObjectSimple } from "./Function Object"
import { FunctionObject } from "../Object/FunctionObject"
import { RealmRecord } from "./Realm"

class ExecutionContext {
    codeEvaluationState: any // for async function and generator to suspend and resume executionContext
    function: FunctionObjectSimple | FunctionObject | null | undefined   
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

function resolveBinding(name , env?: EnvironmentRecord) {
    if(env === undefined) env = (agent.runningExecutionContext as ECMAScriptCodeExecutionContext).lexicalEnvironment
    // 3. If the source text matched by the syntactic production that is being evaluated is contained in strict mode code, let strict be true; else let strict be false.
    return getIdentifierReference(env , name , Boolean())
}

function getGlobalObject() {
    let currentRealm = agent.runningExecutionContext.realm
    return currentRealm.globalObject
}

export {
    ExecutionContext,
    ExecutionContextStack,
    ECMAScriptCodeExecutionContext,
    resolveBinding,
    getGlobalObject
}