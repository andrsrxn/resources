import { IconFlagGT } from '@andrsrxn/icons/flags'
import { ParticlesBackground } from '@/components/particles'

export const Footer = () => {
  return (
    <footer className='relative z-0 h-100 overflow-hidden overflow-x-clip py-6'>
      <ParticlesBackground className='laptop:w-full absolute bottom-0 left-0 z-0 h-100 w-[220%] origin-bottom [&>canvas]:h-100!' />

      <div className='container mx-auto flex h-full w-11/12 flex-col justify-end gap-4'>
        <div className='flex items-center justify-center'>
          <img
            loading='lazy'
            decoding='async'
            className='relative z-1000 aspect-square w-9'
            src='https://res.cloudinary.com/dq5nfyajn/image/upload/v1765561021/symbol_ivn3vf.svg'
            alt='Personal brand symbol'
          />
        </div>
        <ul className='flex w-full items-center justify-center gap-4'>
          <li>
            <a
              className='text-sm underline decoration-1 underline-offset-2'
              href='https://andrsrxn.com'>
              See Portfolio
            </a>
          </li>
        </ul>
        <div className='flex flex-wrap items-center justify-center gap-2' id='author'>
          <p className='text-muted-foreground shrink-0 text-center text-sm leading-none'>
            &copy; {new Date().getFullYear()}. andrsrxn/resources
          </p>
          <IconFlagGT className='h-3' />
        </div>
      </div>
    </footer>
  )
}
