// frontend/src/shared/ui/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
 }
 
 export function Input({ label, ...props }: InputProps) {
	return (
	  <div className="mb-4">
		 <label className="block text-gray-700 mb-2 font-medium">{label}</label>
		 <input
			className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
			{...props}
		 />
	  </div>
	);
 }