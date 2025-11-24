import { AfterViewInit, Directive, ElementRef, HostListener } from "@angular/core";


@Directive({
    selector: '[appAutoResize]',
    standalone: true
})
export class AutoResizeDirective implements AfterViewInit{
  
    constructor(private el: ElementRef<HTMLTextAreaElement>){}

    ngAfterViewInit(): void {
        
        this.adjust()
    }

    @HostListener('input')
    onInput() : void{
        this.adjust()
    }

    // Reseta a altura quando o formulario for enviado
    public reset(): void {
        this.el.nativeElement.style.height = 'auto'
    }


    private adjust(): void{
        const textarea = this.el.nativeElement
        textarea.style.height = 'auto' // reseta para calucular

        const maxHeight = 120

        if (textarea.scrollHeight <= maxHeight) {
            textarea.style.height = `${textarea.scrollHeight}px`
        } else {
            textarea.style.height = `${maxHeight}px`
        }
    }


}