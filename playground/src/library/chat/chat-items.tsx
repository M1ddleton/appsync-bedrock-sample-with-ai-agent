import { View, Card, Alert, Text, useTheme, Flex, Heading, Button } from "@aws-amplify/ui-react"
import { ConversationEvent } from "../../apis/agent-api/types"
import { TypingEffect } from "../typeEffect"
import React, { useEffect, useState } from 'react';
import AWS from '../../aws-config';


interface ChatItemProps {
    text: string
    event: ConversationEvent
    lastEventTime: number,
}

export function UserChatMessage (props: ChatItemProps) {
    return <View textAlign='right' paddingLeft={20} paddingRight={20}>
        <Card lineHeight={2}>
            <Text>
                {props.text}
            </Text>
        </Card>
    </View>
}

export function UserChatError (props: ChatItemProps) {
    return <View paddingLeft={20} paddingRight={20}>
        <Card lineHeight={2}>
            <Alert variation="error" fontSize='smaller'>
                {props.text}
            </Alert>
        </Card>
    </View>
}

export function AgentChatMessage (props: ChatItemProps) {

  const url = props.event.event.audioFileUrl ?? "";
  const [audioUrl, setAudioUrl] = useState<string | "">("");

  useEffect(() => { /* fetch audio file when component is rendered */
    const fetchAudioFile = async () => {

      try {
        const s3 = new AWS.S3(); //create s3 client

        const params = {
          Bucket: 'awsaudiouploads',
          /* extract the folder and name of the file hosted on S3 from the url */
          Key: url.replace('https://awsaudiouploads.s3.amazonaws.com/', ''),
        };
        console.log("fetching audio file with params: ", params);

        // fetch the audio file from S3
        const data = await s3.getObject(params).promise();

        if (data.Body) {
          //convert the audio file to a blob
          const blob = new Blob([data.Body as BlobPart], { type: 'audio/mpeg' });

          // create a URL for the audio file and set it to the state for audioUrl
          const audioUrl = URL.createObjectURL(blob);
          setAudioUrl(audioUrl);
        } else {
          console.error('Audio file body is undefined');
        }
      } catch (error) {
        console.error('Error fetching audio file:', error);
      }
    };

    if (url) {
      fetchAudioFile();
    }
  }, [url]);


  return (
      <Text>
          {
              !props.event.disableTyping && <TypingEffect startTime={props.lastEventTime} text={props.text}/>
          }
          <audio src={audioUrl} controls>
              Your browser does not support the audio element from text.
          </audio>
      </Text>
  );
}

export function AgentPartialChatMessage(props: { text: string }) {
    return <View textAlign='left' paddingLeft={20} paddingRight={20}>
        <View lineHeight={2}>
            <Text>
                {props.text}
            </Text>
        </View>
    </View>
}

function tryFixJsonString (render: string){

    // Some general parsing as the agent often gives results in wildly different formats
    if (render.startsWith('"') && render.endsWith('"')) {
        render = render.substring(1, render.length - 1).replaceAll('\\n', '\n')
    }
    if (render.startsWith('json')) {
        render = render.substring(4)
    }
    try {
        render = JSON.stringify(JSON.parse(render), null, 2)
    }
    catch (e) {
        try {
            render = JSON.stringify(JSON.parse(render.replaceAll('\'', '"')), null, 2)
        }
        catch (e) {}
    }

    return render;
}

export function AgentJSONBlock (props: ChatItemProps) {

    // Then render it
    return <View textAlign='left' paddingLeft={20} paddingRight={20}>
        <View lineHeight={2}>
            <Text>
                <pre><code>
                    {tryFixJsonString(props.text)}
                </code></pre>
            </Text>
        </View>
    </View>
}

export function AgentGraphQLBlock (props: {invoke: () => void} & ChatItemProps) {
    
    return <View textAlign='left' paddingLeft={20} paddingRight={20}> 
        <View lineHeight={2}>
            <Card paddingLeft={10} className="codeBoxHeader">
                <Flex direction='row' justifyContent='space-between'>
                    <Heading>
                        GraphQL Query
                    </Heading>
                    <Heading>
                        <Button className="invokeButton" onClick={props.invoke}>
                            Click To Invoke
                        </Button>
                    </Heading>
                </Flex>
            </Card>
            <pre>
                <code>
                    <Text>
                        {props.text}
                    </Text>
                </code>
            </pre>
        </View>
    </View>
}

export function GraphQLResultBlock (props: ChatItemProps) {    
    return <View textAlign='left' paddingLeft={20} paddingRight={20}> 
        <View lineHeight={2}>
            <Card paddingLeft={10} className="codeBoxHeader">
                <Heading>
                    Query Result
                </Heading>
            </Card>
            <pre >
                <code>
                    <Text>
                        {tryFixJsonString(props.text)}
                    </Text>
                </code>
            </pre>
        </View>
    </View>
}

export function AgentInnerDialogBlock (props: ChatItemProps) {
    const theme = useTheme()

    return <View textAlign='left' paddingLeft={20} paddingRight={20}>
        <View lineHeight={2} padding={theme.tokens.space.medium}> 
            <Text>
                . . .
                <TypingEffect startTime={props.lastEventTime} text={props.text}/>       
            </Text> 
        </View>
    </View>
}

export function AgentWarningBlock (props: ChatItemProps) {
    return <View textAlign='left' paddingLeft={20} paddingRight={20}>
        <View lineHeight={2}>   
            <Alert variation='warning' fontSize='smaller'>
                <TypingEffect startTime={props.lastEventTime} text={props.text}/>
            </Alert>
        </View>
    </View>
}
