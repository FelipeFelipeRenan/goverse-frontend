import { fakeAsync, TestBed, tick, discardPeriodicTasks } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ChatService, ConnectionStatus } from './chat.service';

/** WebSocket falso: o teste decide quando abre, fecha e entrega mensagens. */
class FakeSocket {
    static instances: FakeSocket[] = [];
    readyState = 0;
    sent: string[] = [];
    onopen: ((e: any) => void) | null = null;
    onclose: ((e: any) => void) | null = null;
    onerror: ((e: any) => void) | null = null;
    onmessage: ((e: any) => void) | null = null;
    constructor(public url: string) {
        FakeSocket.instances.push(this);
    }
    send(data: string) { this.sent.push(data); }
    close() { this.readyState = 3; }
    open() { this.readyState = 1; this.onopen?.({}); }
    drop() { this.readyState = 3; this.onclose?.({ code: 1006, wasClean: false }); }
    receive(obj: unknown) { this.onmessage?.({ data: JSON.stringify(obj) }); }
}

describe('ChatService', () => {
    let service: ChatService;
    let statuses: ConnectionStatus[];

    beforeEach(() => {
        FakeSocket.instances = [];
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        service = TestBed.inject(ChatService);
        service.wsCtor = FakeSocket as unknown as typeof WebSocket;
        statuses = [];
        service.status$.subscribe((s) => statuses.push(s));
    });

    const last = () => FakeSocket.instances[FakeSocket.instances.length - 1];

    it('conecta na sala certa e fica open', () => {
        service.connect('room-1');
        expect(last().url).toContain('?roomId=room-1');
        last().open();
        expect(statuses.at(-1)).toBe('open');
    });

    it('entrega mensagens recebidas', () => {
        const got: any[] = [];
        service.onNewMessage().subscribe((m) => got.push(m));
        service.connect('r');
        last().open();
        last().receive({ type: 'CHAT', content: 'oi' });
        expect(got.length).toBe(1);
        expect(got[0].content).toBe('oi');
    });

    it('sendMessage devolve false offline e true conectado', () => {
        service.connect('r');
        expect(service.sendMessage({ content: 'x' })).toBeFalse(); // ainda conectando
        last().open();
        expect(service.sendMessage({ content: 'x' })).toBeTrue();
        expect(JSON.parse(last().sent[0]).content).toBe('x');
    });

    it('reconecta com backoff depois de uma queda e avisa reconnected$', fakeAsync(() => {
        let reconnected = 0;
        service.reconnected$.subscribe(() => reconnected++);
        service.connect('r');
        last().open();
        last().drop();
        expect(statuses.at(-1)).toBe('reconnecting');
        expect(FakeSocket.instances.length).toBe(1);

        tick(1000); // 1ª espera
        expect(FakeSocket.instances.length).toBe(2);
        last().open();
        expect(statuses.at(-1)).toBe('open');
        expect(reconnected).toBe(1);
        discardPeriodicTasks();
    }));

    it('a espera cresce a cada falha seguida', fakeAsync(() => {
        service.connect('r');
        last().drop(); // falha sem nunca abrir
        tick(999);
        expect(FakeSocket.instances.length).toBe(1);
        tick(1);
        expect(FakeSocket.instances.length).toBe(2);
        last().drop();
        tick(1999);
        expect(FakeSocket.instances.length).toBe(2);
        tick(1);
        expect(FakeSocket.instances.length).toBe(3);
        service.disconnect();
    }));

    it('desiste (closed) depois de 10 tentativas', fakeAsync(() => {
        service.connect('r');
        for (let i = 0; i < 11; i++) {
            last().drop();
            tick(15000);
        }
        expect(statuses.at(-1)).toBe('closed');
        const n = FakeSocket.instances.length;
        tick(60000);
        expect(FakeSocket.instances.length).toBe(n);
    }));

    it('disconnect() não reconecta', fakeAsync(() => {
        service.connect('r');
        last().open();
        service.disconnect();
        last().drop();
        tick(60000);
        expect(FakeSocket.instances.length).toBe(1);
        expect(statuses.at(-1)).toBe('closed');
    }));
});
