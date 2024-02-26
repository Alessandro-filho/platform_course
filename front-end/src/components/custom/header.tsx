import { GraduationCap, HelpCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from './mode-theme-toggle';
import { useNavigate } from "react-router-dom";

function Header() {
  let navigate = useNavigate();

  function handleNavigate(path: string) {
    navigate(path);
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-10 p-4 mx-4 text-right bg-white dark:bg-[hsl(222.2,84%,4.9%)]">
      <div className='flex justify-between items-center'>
        <div onClick={() => handleNavigate('/')} className='inline-flex flex-wrap gap-3 cursor-pointer'>
          <GraduationCap /> Let's goooo!
        </div>
        <div className='flex flex-wrap gap-4'>
          <Button onClick={() => handleNavigate('/lists')} variant="outline" size="icon">
            <Plus className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all" />
          </Button>
          <Button onClick={() => handleNavigate('/help')} variant="outline" size="icon">
            <HelpCircle className="h-[1rem] w-[1rem] rotate-0 scale-100 transition-all" />
          </Button>
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}

export default Header;
