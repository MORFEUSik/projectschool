export default function Home() {
	return (
	  <div className="min-h-screen flex flex-col items-center justify-center p-4">
		 <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 text-center">
			Добро пожаловать!
		 </h1>
		 <p className="text-lg md:text-xl text-gray-600 mb-8 text-center max-w-2xl">
			Учись весело с нашей школьной платформой, вдохновлённой Uchi.ru!
		 </p>
		 <div className="flex flex-col sm:flex-row gap-4">
			<button className="btn btn-primary">Начать учиться</button>
			<button className="btn btn-secondary">Узнать больше</button>
		 </div>
	  </div>
	);
 }