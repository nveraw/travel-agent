import { Fragment } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function TravelItinerary({
  conversations,
  loadingMsg,
}: {
  loadingMsg: string;
  conversations: Record<string, string>;
}) {
  return (
    <div className="flex flex-col flex-1 overflow-auto -mr-8 pr-8">
      <div className="flex flex-1 flex-col gap-3 max-w-159.5 w-full mx-auto">
        {Object.keys(conversations).map((question) => (
          <Fragment key={question}>
            <div className="bg-gray-200 max-w-max self-end rounded-xl text-left p-5 ml-20">
              {question}
            </div>
            {conversations[question] && (
              <div className="markdown max-w-max self-start bg-gray-50 rounded-xl text-left p-5 mr-20">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {conversations[question]}
                </ReactMarkdown>
              </div>
            )}
          </Fragment>
        ))}
        {!!loadingMsg.length && (
          <div className="flex-1 flex items-center justify-center animate-pulse">
            {loadingMsg}
          </div>
        )}
        {Object.keys(conversations).length === 0 ? (
          <h1 className="mt-auto text-3xl font-bold mb-5">
            Let’s plan your perfect trip.
          </h1>
        ) : (
          <div className="mt-10" />
        )}
      </div>
    </div>
  );
}

export default TravelItinerary;
