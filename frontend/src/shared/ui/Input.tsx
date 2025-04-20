interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label: string;
 }
 
 export function Input({ label, ...props }: InputProps) {
	return (
	  <div className="mb-4">
		 <label className="block text-gray-700 mb-2">{label}</label>
		 <input
			className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			{...props}
		 />
	  </div>
	);
 }