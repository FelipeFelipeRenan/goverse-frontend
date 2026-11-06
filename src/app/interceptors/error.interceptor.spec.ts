import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ErrorInterceptor } from './error.interceptor';
import { ToastService } from '../services/toast.service';

describe('ErrorInterceptor', () => {
    let http: HttpClient;
    let ctrl: HttpTestingController;
    let toast: jasmine.SpyObj<ToastService>;
    let router: { url: string; navigate: jasmine.Spy };

    function setup(url: string) {
        toast = jasmine.createSpyObj('ToastService', ['error', 'success']);
        router = { url, navigate: jasmine.createSpy('navigate') };
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([ErrorInterceptor])),
                provideHttpClientTesting(),
                { provide: ToastService, useValue: toast },
                { provide: Router, useValue: router },
            ],
        });
        http = TestBed.inject(HttpClient);
        ctrl = TestBed.inject(HttpTestingController);
    }

    function fail(status: number, body: any = null): { propagated: boolean } {
        const out = { propagated: false };
        http.get('/x').subscribe({ error: () => (out.propagated = true) });
        ctrl.expectOne('/x').flush(body, { status, statusText: 'err' });
        return out;
    }

    it('sem conexão (status 0) mostra toast e repassa o erro', () => {
        setup('/home');
        http.get('/x').subscribe({ error: () => {} });
        ctrl.expectOne('/x').error(new ProgressEvent('error'));
        expect(toast.error).toHaveBeenCalledWith('Sem conexão com o servidor.');
    });

    it('401 fora do login: avisa e vai para /login', () => {
        setup('/home');
        const r = fail(401);
        expect(toast.error).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        expect(r.propagated).toBeTrue();
    });

    it('401 no login/cadastro não redireciona nem faz toast (a tela mostra a mensagem)', () => {
        for (const url of ['/login', '/signup']) {
            TestBed.resetTestingModule();
            setup(url);
            fail(401, { message: 'credenciais inválidas' });
            expect(router.navigate).not.toHaveBeenCalled();
            expect(toast.error).not.toHaveBeenCalled();
        }
    });

    it('403 mostra a mensagem do backend', () => {
        setup('/room/1');
        fail(403, { error: 'sala lotada', message: 'sala lotada' });
        expect(toast.error).toHaveBeenCalledWith('sala lotada');
    });

    it('500 mostra erro genérico', () => {
        setup('/home');
        fail(500);
        expect(toast.error).toHaveBeenCalledWith('Erro interno do servidor. Tente novamente mais tarde.');
    });

    it('400 e 409 não geram toast (a tela decide) mas o erro chega ao chamador', () => {
        setup('/signup');
        const r = fail(409, { message: 'e-mail já cadastrado' });
        expect(toast.error).not.toHaveBeenCalled();
        expect(r.propagated).toBeTrue();
    });
});
