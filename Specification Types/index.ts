export class CompletionRecord {
    ['[[Type]]']: 'normal' | 'break' | 'continue' | 'return' | 'throw'
    ['[[Value]]']: any
    ['[[Target]]']: string | 'empty'
}