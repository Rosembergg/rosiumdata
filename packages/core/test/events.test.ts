import { describe, it, expect, vi } from 'vitest'
import { EventEmitter } from '@rosiumdata/core'

describe('EventEmitter', () => {
  it('deve registrar e chamar listener', () => {
    const emitter = new EventEmitter()
    const handler = vi.fn()

    emitter.on('test', handler)
    emitter.emit('test', 'arg1', 'arg2')

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('deve suportar multiplos listeners para o mesmo evento', () => {
    const emitter = new EventEmitter()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    emitter.on('test', handler1)
    emitter.on('test', handler2)
    emitter.emit('test')

    expect(handler1).toHaveBeenCalledOnce()
    expect(handler2).toHaveBeenCalledOnce()
  })

  it('deve permitir remover listener especifico', () => {
    const emitter = new EventEmitter()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    emitter.on('test', handler1)
    emitter.on('test', handler2)
    emitter.off('test', handler1)
    emitter.emit('test')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).toHaveBeenCalledOnce()
  })

  it('nao deve quebrar ao emitir evento sem listeners', () => {
    const emitter = new EventEmitter()
    expect(() => emitter.emit('inexistente')).not.toThrow()
  })

  it('nao deve quebrar ao remover listener de evento inexistente', () => {
    const emitter = new EventEmitter()
    expect(() => emitter.off('inexistente', vi.fn())).not.toThrow()
  })

  it('deve remover todos os listeners de um evento', () => {
    const emitter = new EventEmitter()
    const handler = vi.fn()

    emitter.on('test', handler)
    emitter.removeAllListeners('test')
    emitter.emit('test')

    expect(handler).not.toHaveBeenCalled()
  })

  it('deve remover todos os listeners de todos os eventos', () => {
    const emitter = new EventEmitter()
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    emitter.on('event1', handler1)
    emitter.on('event2', handler2)
    emitter.removeAllListeners()
    emitter.emit('event1')
    emitter.emit('event2')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it('deve passar multiplos argumentos para o handler', () => {
    const emitter = new EventEmitter()
    const handler = vi.fn()

    emitter.on('test', handler)
    emitter.emit('test', 'a', 1, true, { key: 'value' })

    expect(handler).toHaveBeenCalledWith('a', 1, true, { key: 'value' })
  })
})
